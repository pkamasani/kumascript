/*jshint node: true, expr: false, boss: true */

var util = require('util'),
    fs = require('fs'),
    _ = require('underscore'),
    nodeunit = require('nodeunit'),
    XRegExp = require('xregexp'),
    ejs = require('ejs'),
    
    // Loading kumascript modules can use index here, because the tests aren't
    // a part of the package.
    kumascript = require('..'),
    ks_utils = kumascript.utils,
    ks_loaders = kumascript.loaders,
    ks_macros = kumascript.macros;

// Simple loader subclass that builds templates that just JSONify the name and
// arguments for testing purposes.
var JSONifyLoader = ks_utils.Class(ks_loaders.BaseLoader, {
    load: function (name, loaded_cb) {
        // Let's pretend to "load" and "compile" an async template
        var tmpl_fn = function (args, next) {
            var result = JSON.stringify([name, args]);
            next(null, result);
        };
        // Okay, the template has been loaded, so pass to the callback.
        loaded_cb(null, tmpl_fn);
    }
});

// Main test case starts here
module.exports = nodeunit.testCase({

    "Basic template loading should work": function (test) {
        
        var loader = new JSONifyLoader(),
            data = ["test123", ["alpha", "beta", "gamma"]],
            expected = JSON.stringify(data);

        loader.get(data[0], function (err, tmpl_fn) {
            
            test.ok(!err);
            test.notEqual(typeof(tmpl_fn), 'undefined');
        
            tmpl_fn(data[1], function (err, result) {
                test.equal(result, expected);
                test.done();
            });

        });

    },

    "Template loading with local caching should work": function (test) {
        
        var loader = new JSONifyLoader(),
            data = ["test123", ["alpha", "beta", "gamma"]],
            expected = JSON.stringify(data);

        // Install the caching mixin into the loader.
        _.extend(loader, ks_loaders.LocalCacheMixin);

        loader.get(data[0], function (err, tmpl_fn) {
            
            test.ok(!err);
            test.notEqual(typeof(tmpl_fn), 'undefined');
        
            tmpl_fn(data[1], function (err, result) {
                test.equal(result, expected);
                // Ensure the cache is present, and populated
                test.notEqual(typeof(loader.cache), 'undefined');
                test.ok(data[0] in loader.cache);
                test.done();
            });

        });
    },

    "Basic macro substitution should work": function (test) {
        var mp = new ks_macros.MacroProcessor({ 
            loader: new JSONifyLoader()
        });
        fs.readFile(__dirname + '/data/macros1.txt', function (err, data) {
            if (err) { throw err; }
            var parts = (''+data).split('---'),
                src      = parts[0],
                expected = parts[1];
            mp.process(src, function (err, result) {
                test.equal(result.trim(), expected.trim());
                test.done();
            });
        });
    }

    // TODO: Template loading via HTTP (preload, async, before processing?)
    // TODO: Template execution

});