SVGTable = function (root_width, root_height, i_options) {
    // classes
    // - selecting : selecting
    // - 
    var DEFAULTS = {
        cell_text: null // list(list(str))[col][row]
        , cell_text_is_row_col: false // set true if cell_text list(list(str))[row][col]
        , cell_text_offset: [10, 23] //
        //--- rows
        , row_num: null // int : if cell_heights is not null, equal divide
        , row_heights: null // list(int) : active when row_num is null
        , row_heights_is_ratio: null // if true, row_heights use as ratio ( the_cell_height[y][x] = row_heights[y][x]/sum(row_heights[y]))
        , cell_heights: null // list(list(int)) or null : active when both row_num and row_heights is null
        , cell_heights_is_ratio: null // if true, cell_heights use as ratio ( the_cell_height[y][x] = cell_heights[y][x]/sum(cell_heights[y]))

        //--- columns
        , column_num: null  // int : if cell_heights is not null, equal divide
        , column_widths: null // list(int) or null : if cell_heights is null, equal divide
        , column_widths_is_ratio: null // bool : if true, cell_heights use as ratio ( the_cell_height[y][x] = cell_heights[y][x]/sum(cell_heights[y]

        //--- names
        // column names
        , column_name_list: null // iter(str) or list(str) or null : column_num
        , column_name_height: 0// int
        , column_name_text_transform: '' // string
        , column_name_widths: null //
        // row names
        , row_name_list: null // iter(str) or list(str) or null : row-num
        , row_name_text_offset: [0, 0] // (int, int) : (offsetX, offsetY)
        , row_name_text_transform: '' // string
        , row_name_width: 0//
        , row_name_heights: null // 
        , horizontal_scale_list: null //list(int) : the int is absolute y position regardless of cell_height_is_ratio
        , vertical_scale_list: null //list(int) : the int is absolute y position regardless of cell_height_is_ratio
        , select_mode: 'horizontal' //string : 

        //-- advance
        , CLASSES: {} // css classes
        , select_cell: null // func : is_active_cell(cell, col, row, status)
        , cell_hook: null // func : hook(cell_elem)
    };
    var SVGNS = 'http://www.w3.org/2000/svg';
    var that = this;

    var CLASSES = {
        selecting: 'selecting',
        active: 'active',
        cell: 'svg_cell',
        table: 'svg_table',
        row_name: 'row_name',
        column_name: 'column_name'
    };


    // extend args d:jquery
    var args = (function () {
        var options = $.extend(true, {}, DEFAULTS);
        $.extend(true, options, i_options);
        return options;
    })();


    // args
    $.extend(true, CLASSES, args.CLASSES);
    this.options = args;


    // init root object d:jquery
    this.table_root = $('<div/>').height(root_height).width(root_width);


    // init svg_root d:snap.svg
    this.svg_root = Snap(document.createElementNS(SVGNS, 'svg'));
    this.svg_root.attr({'width': root_width, 'height': root_height, 'class': 'svg_table'});
    this.table_root.append(this.svg_root.node);


    // actions
    var actions = {};
    actions.clear_selecting = function () {
        var col, row;
        for (col = that.cells.length; col--;) {
            for (row = that.cells[col].length; row--;) {
                that.cells[col][row].removeClass(CLASSES.selecting);
            }
        }
    };
    var _is_in_select = null;
    this.set_select_mode = function (select_mode) {
        _is_in_select = {  // select mode dictionary
            null: args.activate_cell,//
            'rectangle': function (cell, col, row, status) {
                var min_col = Math.min(status.start_col, status.end_col);
                var max_col = Math.max(status.start_col, status.end_col);
                var min_row = Math.min(status.start_row, status.end_row);
                var max_row = Math.max(status.start_row, status.end_row);
                return (
                    (min_col <= col && col <= max_col) &&
                    (min_row <= row && row <= max_row)
                    )
            },
            'horizontal': function (cell, col, row, status) {
                var column_num = args.column_num === null ? args.column_widths.length : args.column_num;
                var x = col + row * column_num;
                var i = status.start_col + status.start_row * column_num;
                var j = status.end_col + status.end_row * column_num;
                return ((i <= x && x <= j) || (j <= x && x <= i));
            },
            'vertical': function (cell, col, row, status) {
                var row_num = args.row_num;
                var x = col * row_num + row;
                var i = status.start_col * row_num + status.start_row;
                var j = status.end_col * row_num + status.end_row;
                return ((i <= x && x <= j) || (j <= x && x <= i));
            }
        }[select_mode]
    };
    this.set_select_mode(args.select_mode);

    actions.toggle_class = function (class_name, status, is_add) {
        if (is_add === undefined) {
            is_add = !that.cells[status.start_col][status.start_row].hasClass(class_name);
        }
        var row, col;
        for (col = that.cells.length; col--;) {
            for (row = that.cells[col].length; row--;) {
                var flag = _is_in_select(that.cells[col][row], col, row, status);
                if (flag) {
                    that.cells[col][row].toggleClass(class_name, is_add);
                }
            }
        }
    };


    // handler
    var status = {
        start_col: 0, end_col: 0,
        start_row: 0, end_row: 0,
        startX: 0, endX: 0,
        startY: 0, endY: 0
    };
    var event_handler_factory = function (ix, iy) {
        return function (event) {
            var save_status_start = function () {
                status.start_col = ix;
                status.start_row = iy;
                status.startX = event.clientX;
                status.startY = event.clientY;
            };
            var save_status_end = function () {
                status.end_col = ix;
                status.end_row = iy;
                status.endX = event.clientX;
                status.endY = event.clientY;
            };
            switch (event.type) {
                case 'mousedown':
                    save_status_start();
                    save_status_end();
                    actions.toggle_class(CLASSES.selecting, status, true);
                    break;
                case 'mouseover':
                    save_status_end();
                    actions.clear_selecting();
                    if (event.buttons != 0 && event.which % 2 != 0) {
                        actions.toggle_class(CLASSES.selecting, status, true);
                    }
                    break;
                case 'mouseup':
                    save_status_end();
                    actions.clear_selecting();
                    actions.toggle_class(CLASSES.active, status);
                    break;
                case 'mouseout':
                    actions.clear_selecting();
                    break;
            }
            event.preventDefault();
        };
    };
    document.body.addEventListener('mouseup', actions.clear_selecting);


    // generate names
    this.names_root = that.svg_root.g();

    if (args.column_name_list !== null && args.row_name_list !== null) {
        (function () {
            var cell_root = that.names_root.g()
                    .addClass(CLASSES.table).addClass(CLASSES.cell)
                ;
            cell_root.rect(0, 0, args.row_name_width, args.column_name_height);
        })();
    }
    // generate row_name d:snap.svg
    this.row_name_cells = new Array(this.row);
    if (args.row_name_list !== null) {
        (function () {
            var row_names_root = that.names_root.g();
            var w = args.row_name_width;
            var offsetY = args.column_name_height;
            for (var y = 0; y < args.row_name_list.length; y++) {
                var cell_root = row_names_root.g()
                        .addClass(CLASSES.table).addClass(CLASSES.row_name).addClass(CLASSES.cell)
                    ;
                cell_root.transform('translate(0,' + offsetY + ')');
                that.row_name_cells[y] = cell_root;
                var text = args.row_name_list[y];
                var h = args.row_name_heights === null ? ((root_height - args.column_name_height) / args.row_name_list.length) : args.row_name_heights[y];
                cell_root.rect(0, 0, w, h);
                var transform_value = args.row_name_text_transform
                        .replace('${width}', w).replace('${height}', h) // ISSUE#1
                    ;
                cell_root.text(0, 0, text).attr('transform', transform_value)
                    .disableUserSelect();
                offsetY += h;
            }
        })();
    }


    // generate column_name 
    this.column_name_cells = null;
    if (args.column_name_list !== null) {
        this.column_name_cells = new Array(args.column_name_list.length);
        (function () {
            var column_names_root = that.names_root.g();
            var h = args.column_name_height;
            var offsetX = args.row_name_width;
            for (var col = 0; col < args.column_name_list.length; col++) {
                var cell_root = column_names_root.g()
                        .addClass(CLASSES.table).addClass(CLASSES.column_name).addClass(CLASSES.cell)
                    ;
                cell_root.transform('translate(' + offsetX + ',0)');
                that.column_name_cells[col] = cell_root;
                var text = args.column_name_list[col];
                var w = args.column_name_widths === null ? ((root_width - args.row_name_width) / args.column_name_list.length) : args.column_name_widths[col];
                cell_root.rect(0, 0, w, h);
                var transform_value = args.column_name_text_transform
                        .replace('${width}', w).replace('${height}', h) // ISSUE#1
                    ;
                cell_root.text(0, 0, text).attr('transform', transform_value)
                    .disableUserSelect();
                offsetX += w;
            }
        })();
    }


    // generate cells
    this.cells_root = this.svg_root.group();
    this.cells = new Array(args.column_num || args.column_widths.length);
    this.texts = new Array(this.cells.length);
    (function () {
        var get_width = args.column_num === null ?
            function (col) {
                return args.column_widths_is_ratio
                    ? args.column_widths[col] * root_width / args.column_widths.reduce(function (p, n) {
                    return p + n;
                })
                    : args.column_widths[col];
            } :
            function (col) {
                return (root_width - args.row_name_width) / args.column_num;
            };
        var get_height = (function () {
            if (args.row_num !== null) {
                return function (col, row) {
                    return (root_height - args.column_name_height) / args.row_num;
                }
            }
            if (args.row_heights !== null) { // args.row_heights is active
                if (args.row_heights_is_ratio) {
                    return function (col, row) {
                        var height_sum = args.row_heights.reduce(function (p, n) {
                            return p + n
                        });
                        return args.row_heights[row] * (root_height - args.column_name_height) / height_sum;
                    }
                } else {
                    return function (col, row) {
                        return args.row_heights[row];
                    }
                }
            } else { // args.cell_heigts is active
                if (args.cell_heights_is_ratio) {
                    return function (col, row) {
                        var height_sum = args.cell_heights[col].reduce(function (p, n) {
                            return p + n
                        });
                        return args.cell_heights[col][row] * (root_height - args.column_name_height) / height_sum;
                    }
                } else {
                    return function (col, row) {
                        return args.cell_heights[col][row];
                    }
                }
            }
        })();


        var offsetX, offsetY, h, w, text, col_root, cell_root;
        offsetX = args.row_name_list === null ? 0 : args.row_name_width;
        var column_num = args.column_num === null ? args.column_widths.length : args.column_num
        for (var col = 0; col < column_num; col++) {
            var row_num = args.row_num === null ? (args.row_heights === null ? args.cell_heights[col].length : args.row_heights.length) : args.row_num;
            offsetY = args.column_name_list === null ? 0 : args.column_name_height;
            w = get_width(col);
            that.cells[col] = new Array(row_num);
            that.texts[col] = new Array(row_num);
            col_root = that.cells_root.group();
            for (var row = 0; row < row_num; row++) {
                var handler = event_handler_factory(col, row);
                cell_root = col_root.group()
                    .addClass(CLASSES.table).addClass(CLASSES.cell)
                    .data('col', col).data('row', row)
                    .mousedown(handler).mouseover(handler).mouseup(handler);
                that.cells[col][row] = cell_root;
                h = get_height(col, row);
                text = (function(){
                    if(args.cell_text === null){
                        return "";
                    }
                    if(args.cell_text_is_row_col){
                        return args.cell_text[row][col];
                    }
                    return args.cell_text[col][row];
                })
                cell_root.rect(offsetX, offsetY, w, h);
                var text_offsetX = args.cell_text_offset === null ? 0 : args.cell_text_offset[0],
                    text_offsetY = args.cell_text_offset === null ? 0 : args.cell_text_offset[1];
                that.texts[col][row] = cell_root.text(offsetX + text_offsetX, offsetY + text_offsetY, text)
                    .disableUserSelect();
                if (args.cell_hook !== null) {
                    args.cell_hook(cell_root);
                }
                offsetY += h;
            }
            offsetX += w;
        }
    })();
};
SVGTable.prototype.get_root_elem = function () {
    return this.table_root.get(0);
};
SVGTable.prototype.get_active_cells = function () {

};