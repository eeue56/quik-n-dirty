// union takes two record sets and combines them into a 
// single one - provided that each record is in both data sets
var union = function(firstRecords, secondRecords){

    var outRecords = [];

    for (var i = 0; i < firstRecords.length; i++){
        var firstRecord = firstRecords[i];
        
        for (var j = 0; j < secondRecords.length; j++){
            var secondRecord = secondRecords[j];

            if (firstRecord[0] == secondRecord[0]){
                outRecords.push(firstRecord);
                break;
            }
        }
    }

    return outRecords;
};

var difference = function(firstRecords, secondRecords){

    var outRecords = [];

    for (var i = 0; i < firstRecords.length; i++){
        var found = false;
        var firstRecord = firstRecords[i];

        for (var j = 0; j < secondRecords; j++){
            var secondRecord = secondRecords[j];

            if (firstRecord === secondRecord){
                found = true;
                break;
            }
        }

        if (!found){
            outRecords.push(firstRecord);
        }
    }

    return outRecords;
};


// join two sets of records 
var setJoin = function(firstRecords, secondRecords){

    var outRecords = [];

    for (var i = 0; i < firstRecords.length; i++){
        var found = false;
        var firstRecord = firstRecords[i];
        var tempRecord = firstRecord[i];

        for (var j = 0; j < secondRecords; j++){
            var secondRecord = secondRecords[j];

            if (firstRecord === secondRecord){
                // todo: apply set theory here
                break;

            }
        }

        outRecords.push(tempRecord);
    }

    return outRecords;
};


angular.module("CsvParser", [])

.factory('CsvParser', function() {

    function CsvParser(data, fieldSpliterChar, recordSpliterChar, options){

        if (!(this instanceof CsvParser)) return new CsvParser(data, fieldSpliterChar, recordSpliterChar);

        this._data = data.trim();
        this._fieldSpliterChar = fieldSpliterChar || ',';
        this._recordSpliterChar = recordSpliterChar || '\n';

        this.parsedData = {
            headers: [],
            values: []
        };

        if (typeof options === "undefined") options = null;

        this.parse(options);
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
            if (typeof options === "undefined" || options === null){
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

            console.log(this.parsedData);

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
        doesRecordMatch: function(record, columnName, value){
            var me = this;
            var columnIndex = me.find(columnName);

            if (value.length < 1 || columnIndex < 0) return true;

            return value.indexOf(record[columnIndex]) > -1;
        },
        _recordsXByColumns: function(comparisonFunction){
            var records = [];

            for (var i = 0; i < this.parsedData.values.length; i++){
                var currentRecord = this.parsedData.values[i];
                if (comparisonFunction(currentRecord)){
                    records.push(currentRecord);
                } 
            }

            return records;
        },
        // columns should be an object with 
        // key : [values]
        // returns records where the columns don't match any values given
        //
        // TODO: all "records..ByColumns" can be refactored into being much smaller
        recordsWithoutByColumns: function(columns){
            var me = this;

            // creates a function which returns true if a record does not contain the values
            // in "values" 
            var is_without = function(columns){
                return function(record){
                    for (var key in columns){
                        if (me.doesRecordMatch(record, key, columns[key])){
                            return false;
                        }
                    }

                    return true;
                };
            }(columns);

            return this._recordsXByColumns(is_without);
        },
        recordsWithByColumns: function(columns){

            var me = this;

            // creates a function which returns true if a record does contain the value
            // in "values" 
            var is_with = function(columns){
                return function(record){
                    for (var key in columns){
                        if (!me.doesRecordMatch(record, key, columns[key])){
                            return false;
                        }
                    }

                    return true;
                };
            }(columns);

            return this._recordsXByColumns(is_with);
        },
        // How do you feel?
        //  Happy || Empowered || Glad
        //  1      | 0          | 1
        // Happy -> True
        // Happy Empowered -> True
        // Happy Glad -> True
        // Empowered -> False
        //  -> False
        recordsWithByAndColumns: function(columns){
            var me = this;

            // creates a function which returns true if a record does contain the value
            // in "values" 
            var is_all = function(columns){
                return function(record){
                    for (var key in columns){
                        var values = columns[key];
                        var currentIndex = me.find(key);

                        if(typeof(record[currentIndex]) === "undefined" || record[currentIndex].trim() === "") return false;

                        
                        // assumes record entry is an array
                        for (var i = 0; i < values.length; i++){
                            if (me.doesRecordMatch(record, key, columns[key])){
                                return false;
                            }
                        }
                    }

                    return true;
                };

            }(columns);

            return this._recordsXByColumns(is_all);
        },
        // How do you feel?
        //  Happy || Empowered || Glad
        //  1      | 0          | 1
        // Happy -> True
        // Happy Empowered -> True
        // Happy Glad -> True
        // Empowered -> False
        //  -> False
        isRecordWithByAndColumns: function(columns, record){


            var me = this;

            var is_in_array = function(values, val) {
                return values.indexOf(val) > -1;
            };

            for (var key in columns){
                var values = columns[key];
                var currentIndex = me.find(key);

                if (values.length < 1) continue;
                if (currentIndex < 0){
                    console.log("No such field as ", key);
                    continue;
                } 
                
                console.log("key is..", key);
                console.log("values is.. ", values);
                console.log("record value is.. ", record[currentIndex]);

                if(typeof(record[currentIndex]) === "undefined" || record[currentIndex].trim() === "") return false;

                // assumes record entry is an array
                for (var i = 0; i < values.length; i++){
                    if (!is_in_array(values[i], record[currentIndex])){
                        return false;
                    }
                }
            }

            return true;

        },
        // TODO: rename
        // returns records where a given set of column names must contain all the values 
        // in the associated array  
        recordsWithoutByAndColumns: function(columns){
             var me = this;


            // creates a function which returns true if a record does contain the value
            // in "values" 
            var is_not_all = function(columns){
                return function(record){
                    for (var key in columns){
                        var values = columns[key];
                        var currentIndex = me.find(key);

                        if (values.length < 1) continue;

                        // assumes record entry is an array
                        for (var i = 0; i < values.length; i++){
                            if (!me.doesRecordMatch(record, key, columns[key])){
                                return false;
                            }
                        }
                    }

                    return true;
                };

            }(columns);

            return this._recordsXByColumns(is_not_all);
        },
        //
        andor: function(wrappedColumns){
            var me = this;
            console.log("wrapped", wrappedColumns);

            var orRecords = me.recordsWithoutByColumns(wrappedColumns["OR"]);
            var andRecords = me.recordsWithoutByAndColumns(wrappedColumns["AND"]);

            var joined = union(orRecords, andRecords);

            return joined;
        }
    };

    return CsvParser;
});