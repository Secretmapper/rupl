/**
 * CoderController
 *
 * @description :: Server-side logic for managing Coders
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  code: function (req, res) {
		var PythonShell = require('python-shell');

		var tmp = require('tmp');
		var fs = require('fs');
		tmp.file({ dir:'.', mode: 0755, prefix: '', postfix: '.py' },
			function _tempFileCreated(err, path, fd,cleanupCallback) {
		  if (err) throw err;
			fs.writeFileSync(path, req.param('code'))
			PythonShell.defaultOptions = {scriptPath: '.'}
			PythonShell.run(path, function (err, results) {
			  cleanupCallback();
        if(err){
          var err = err.stack
          err = err.substr(0, err.indexOf('  at [object Object].PythonShell.parseError ('));
          err = err.substr(err.indexOf('",')+3, err.length)
          err = 'Error: ' + err
        }
				return res.json({
					results: results,
          err: err
				});
			});
		});
  },
};
