module.exports.run_setup = function(app){
    var passport = require('passport')
    var mysql = require('mysql');
    class Database {
        constructor( config ) {
            this.connection = mysql.createConnection( config );
        }
        query( sql, args ) {
            return new Promise( ( resolve, reject ) => {
                this.connection.query( sql, args, ( err, rows ) => {
                    if ( err )
                        return reject( err );
                    resolve( rows );
                } );
            } );
        }
        close() {
            return new Promise( ( resolve, reject ) => {
                this.connection.end( err => {
                    if ( err )
                        return reject( err );
                    resolve();
                } );
            } );
        }
    }

    var database = new Database({
        host: process.env.DIRECTOR_DATABASE_HOST,
        user: process.env.DIRECTOR_DATABASE_USERNAME,
        password: process.env.DIRECTOR_DATABASE_PASSWORD,
        database: process.env.DIRECTOR_DATABASE_NAME
    })
    app.get('/play', async function(req, res){
        //passport.authenticate("google")
       // if (req.user){
            let userData = await database.query("SELECT data FROM chess_players WHERE id=\'"+116264767626572588517+"\'")
            res.render('index.hbs', JSON.parse(userData[0].data));//, JSON.parse(userData[0].data)) 
        //}
        // else{
        //     // res.redirect('/login')
        //     req.user = 111111;
        //     res.redirect('/play')
        // }
    })
}