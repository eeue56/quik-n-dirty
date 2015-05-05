angular.module("CsvParser", [])

.factory('CsvParser', function() {

    function CsvParser(data, fieldSpliterChar, recordSpliterChar){

        if (!(this instanceof CsvParser)) return new CsvParser(data, fieldSpliterChar, recordSpliterChar);

        this._data = data;
        this._fieldSpliterChar = fieldSpliterChar || ',';
        this._recordSpliterChar = recordSpliterChar || '\n';


        this.parsedData = {
            headers: [],
            values: []
        };

        this.parse();
    };

    // spliter is the text to split on
    // text is the text to split
    var _split = function(splitter, text){ 
        return text.split(splitter);
    };

    CsvParser.prototype = {
        // split text up by field
        fieldSplit: function(text) {
            return _split(this._fieldSpliterChar, text);
        },
        // split text up by record
        recordSplit: function(text) {
            return _split(this._recordSpliterChar, text);
        },
        // parse the data and store it in parsedData
        // field headers are stored in parsedData.headers
        // takes options object
        // options: 
        //      hasHeaders: boolean to say if first record in file contains headers
        //      headers: array of string names to use as headers
        // if headers is defined then hasHeaders must be set to false.
        // 
        parse: function(options) {
            if (typeof options === "undefined"){
                options = {
                    hasHeaders: true
                };
            }

            var me = this;
            var temp = this.recordSplit(this._data).map(function(v){
                return me.fieldSplit(v);
            });

            if (options.hasHeaders) {
                this.parsedData.headers = temp[0];
                this.parsedData.values = temp.splice(1);
            } else {
                this.parsedData.headers = [];
                this.parsedData.values = temp;
            }

            if (typeof options.headers !== "undefined"){
                this.parsedData.headers = options.headers;
            }
        }, 
        // returns the index of the field header with a given name
        // or -1 if not found
        find: function(name) {
            return this.parsedData.headers.indexOf(name);
        },
        // gets an entire column by name
        getColumn: function(name) { 
            var index = this.find(name);

            return this.parsedData.values.map(function(v){
                return v[index];
            });
        },
        // returns the "named" field of a given record
        columnOf: function(name, record){
            // TODO: move this out into record prototype
            var index = this.find(name);

            return record[index];
        },
        // returns the "named" field of all records
        columnOfAll: function(name){
            var me = this;
            return this.parsedData.values.map(function(v) {
                return me.columnOf(name, v);
            });
        },
        // filters records by a named column being passed to a given comparision function
        filterByColumn: function(columnName, comparison){
            var index = this.find(columnName);

            return this.parsedData.values.filter(function(value, i, obj){
                return comparison(value[index], i, obj);
            });
        },
        // returns records where named column of record is equal to some value
        recordsWith: function(columnName, value){
            return this.filterByColumn(columnName, function(val){
                return val === value;
            });
        },
        // returns records where named column of record is not equal to some value
        recordsWithout: function(columnName, value){
            var comparison = function(val){
                return val !== value;
            };

            if (value instanceof Array) {
                comparison = function(val){
                    return value.indexOf(val) === -1;
                };
            }

            return this.filterByColumn(columnName, comparison);
        },
        // columns should be an object with 
        // key : [values]
        // returns records where the columns don't match any values given
        recordsWithoutByColumns: function(columns){
            
            var me = this;

            var is_in_array = function(values, val) {
                return values.indexOf(val) > -1;
            };

            // creates a function which returns true if a record does not contain the values
            // in "values" 
            var is_without = function(columns){
                return function(record){
                    for (var key in columns){
                        var values = columns[key];
                        var currentIndex = me.find(key);

                        if (values.length < 1 || currentIndex < 0){
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
        },
        recordsWithByColumns: function(columns){

            var me = this;

            var is_in_array = function(values, val) {
                return values.indexOf(val) > -1;
            };

            // creates a function which returns true if a record does contain the value
            // in "values" 
            var is_with = function(columns){
                return function(record){
                    for (var key in columns){
                        var values = columns[key];
                        var currentIndex = me.find(key);

                        if (values.length < 1) continue;
                        if (currentIndex < 0){
                            console.log("No such field as ", key);
                            continue;
                        } 

                        if (!is_in_array(values, record[currentIndex])){
                            return false;
                        }
                    }

                    return true;
                };
            }(columns);

            var records = [];

            for (var i = 0; i < this.parsedData.values.length; i++){
                var currentRecord = this.parsedData.values[i];
                if (is_with(currentRecord)){
                    records.push(currentRecord);
                } 
            }

            return records;
        },
        recordsWithByAndColumns: function(columns){

        },
        // TODO: rename
        // returns records where a given set of column names must contain all the values 
        // in the associated array  
        recordsWithoutByAndColumns: function(columns){

        }
    };

    return CsvParser;
});
