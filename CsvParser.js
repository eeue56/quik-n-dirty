angular.module('CsvParser', [])

.factory('CsvParser', function() {

    function CsvParser(data, fieldSpliterChar, recordSpliterChar){

        if (!(this instanceof CsvParser)) return new CsvParser(data, spliter);

        this._data = data;
        this._fieldSpliterChar = fieldSpliterChar || ',';
        this._recordSpliterChar = recordSpliterChar || '\n';


        this.parsedData = {
            headers: [],
            values: []
        };

        this.parse();
    };

    var _split = function(splitter, text){ 
        return text.split(splitter);
    };

    CsvParser.prototype = {
        fieldSplit: function(text) {
            var me = this;
            return _split(me._fieldSpliterChar, text);
        },
        recordSplit: function(text) {
            return _split(this._recordSpliterChar, text);
        },
        parse: function() {
            var me = this;
            var temp = this.recordSplit(this._data).map(function(v){
                return me.fieldSplit(v);
            });

            this.parsedData.headers = temp[0];
            this.parsedData.values = temp.splice(1);
        }, 
        find: function(name) {
            return this.parsedData.headers.indexOf(name);
        },
        getColumn: function(name) { 
            var index = this.find(name);

            return this.parsedData.values.map(function(v){
                return v[index];
            });
        },
        columnOf: function(name, record){
            // TODO: move this out into record prototype
            var index = this.find(name);

            return record[index];
        },
        filterByColumn: function(columnName, comparison){
            var index = this.find(columnName);

            return this.parsedData.values.filter(function(value, i, obj){
                return comparison(value[index], i, obj);
            });
        },
        recordsWith: function(columnName, value){
            return this.filterByColumn(columnName, function(val){
                return val === value;
            });
        },
        recordsWithout: function(columnName, value){
            var comparison = function(val){
                return val != value;
            };

            if (value instanceof Array) {
                comparison = function(val){
                    return value.indexOf(val) === -1;
                };
            }

            return this.filterByColumn(columnName, comparison);
        },
        recordsWithoutByColumns: function(columns){
            // columns should be an object with 
            // key : [values]

            var me = this;

            var is_in_array = function(values, val) {
                return values.indexOf(val) > -1;
            };

            var is_without = function(columns){
                return function(record){
                    for (var key in columns){
                        var values = columns[key];
                        var currentIndex = me.find(key);

                        if (values.length < 1){
                            console.log("No values for key, ", key);
                            continue;
                        }

                        if (currentIndex < 0) {
                            console.log("Key, ", key, "not found");
                            continue;
                        }

                        if (is_in_array(values, record[currentIndex])){
                            return false;
                        }
                    }

                    return true;
                };
            }(columns);

            var records = [];

            for (var i = 0; i < this.parsedData.values.length; i++){
                var currentRecord = this.parsedData.values[i];
                if (is_without(currentRecord)){
                    records.push(currentRecord);
                } 
            }

            return records;
        }   
    };

    return CsvParser;
})
