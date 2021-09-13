var login = require('./login.js');
var play = require('./play.js');
module.exports.do_setup = function(app){
    login.run_setup(app);
    play.run_setup(app);
}