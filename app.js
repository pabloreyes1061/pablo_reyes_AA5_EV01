// 1 - Invocamos a Express
const express = require('express');
const app = express();

//2 - Para poder capturar los datos del formulario (sin urlencoded nos devuelve "undefined")
app.use(express.urlencoded({extended:false}));
app.use(express.json());//además le decimos a express que vamos a usar json

//3- Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env'});

//4 -seteamos el directorio de assets
app.use('/resources',express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

//5 - Establecemos el motor de plantillas
app.set('view engine','ejs');

//6 -Invocamos a bcrypt
const bcrypt = require('bcryptjs');

//7- variables de session
const session = require('express-session');
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: false
}));


// 8 - Invocamos a la conexion de la DB
const connection = require('./database/db');

//9 - establecemos las rutas--------------------------------------------
//mostrar tabla -users
app.get('/db', (req, res) => {
    const query = 'SELECT * FROM login.users';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error al realizar la consulta:', error);
            return;
        } 
		results.forEach(element => {
			console.log(element)
		});
        res.json(results);
		
    });
});


//obtener por id----------------------
app.get('/db/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM login.users WHERE id=?';
    connection.query(query, [id], (error, results) => {
        if (error) {
            console.error('Error al realizar la consulta:', error);
            res.status(500).json({ error: 'Error al obtener los datos' });
            return;
        } 
        res.json(results);	
    });
});


//borrar user--------------------------------------

app.use('/delete/:id',(req,res)=>{
	const id = req.params.id
	const query = 'DELETE FROM users WHERE id = ?';
	connection.query(query,[id], (error, results) =>{
		if(error){
			console.log(error)
			return
		}else{
			res.json(results)
		}
	})
})


	app.get('/login',(req, res)=>{
		res.render('login');
	})

	app.get('/register',(req, res)=>{
		res.render('register');
	})

//10 - Método para la REGISTRACIÓN
app.post('/register', async (req, res)=>{
	const user = req.body.user;
	const name = req.body.name;
    const rol = req.body.rol;
	const pass = req.body.pass;
	// let passwordHash = await bcrypt.hash(pass, 8);
    connection.query('INSERT INTO users SET ?',{user:user, name:name, rol:rol, pass:pass}, async (error, results)=>{
        if(error){
            console.log(error);
        }else{            
			res.render('register', {
				alert: true,
				alertTitle: "Registracion",
				alertMessage: "¡Registracion Completada!",
				alertIcon:'success',
				showConfirmButton: false,
				timer: 1500,
				ruta: ''
			});
            //res.redirect('/');         
        }
	});
})



//11 - Metodo para la autenticacion
app.post('/auth', async (req, res)=> {
	const user = req.body.user;
	const pass = req.body.pass;    
    // let passwordHash = await bcrypt.hash(pass, 8);
	if (user && pass) {
		connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results, fields)=> {
			if( results.length == 0 || !(await pass === results[0].pass) ) {    
				res.render('login', {
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "USUARIO y/o PASSWORD incorrecto",
                        alertIcon:'error',
                        showConfirmButton: true,
                        timer: false,
                        ruta: 'login'    
                    });
				
				//Mensaje simple y poco vistoso
                //res.send('Incorrect Username and/or Password!');				
			} else {         
				//creamos una var de session y le asignamos true si INICIO SESSION       
				req.session.loggedin = true;                
				req.session.name = results[0].name;
				res.render('login', {
					alert: true,
					alertTitle: "Conexión exitosa",
					alertMessage: "¡BIENVENIDO A TIENDA ONLINE!",
					alertIcon:'success',
					showConfirmButton: false,
					timer: 1500,
					ruta: ''
				});        			
			}			
			res.end();
		});
	} else {	
		res.send('Please enter user and Password!');
		res.end();
	}
});

//12 - Método para controlar que está auth en todas las páginas
app.get('/', (req, res)=> {
	if (req.session.loggedin) {
		res.render('index',{
			login: true,
			name: req.session.name			
		});		
	} else {
		res.render('index',{
			login:false,
			name:'Debe iniciar sesión',			
		});				
	}
	res.end();
});


//función para limpiar la caché luego del logout
app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

 //Logout
//Destruye la sesión.
app.get('/logout', function (req, res) {
	req.session.destroy(() => {
	  res.redirect('/') // siempre se ejecutará después de que se destruya la sesión
	})
});


app.listen(3000, (req, res)=>{
    console.log('SERVER RUNNING IN http://localhost:3000');
});




// app.post('/auth', async (req, res)=> {
// 	const user = req.body.user;
// 	const pass = req.body.pass;    
//     let passwordHash = await bcrypt.hash(pass, 8);
// 	if (user && pass) {
// 		connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results, fields)=> {
// 			if( results.length == 0 || !(await bcrypt.compare(pass, results[0].pass)) ) {    
// 				res.render('login', {
//                         alert: true,
//                         alertTitle: "Error",
//                         alertMessage: "USUARIO y/o PASSWORD incorrecto",
//                         alertIcon:'error',
//                         showConfirmButton: true,
//                         timer: false,
//                         ruta: 'login'    
//                     });
				
// 				//Mensaje simple y poco vistoso
//                 //res.send('Incorrect Username and/or Password!');				
// 			} else {         
// 				//creamos una var de session y le asignamos true si INICIO SESSION       
// 				req.session.loggedin = true;                
// 				req.session.name = results[0].name;
// 				res.render('login', {
// 					alert: true,
// 					alertTitle: "Conexión exitosa",
// 					alertMessage: "¡BIENVENIDO A TIENDA ONLINE!",
// 					alertIcon:'success',
// 					showConfirmButton: false,
// 					timer: 1500,
// 					ruta: ''
// 				});        			
// 			}			
// 			res.end();
// 		});
// 	} else {	
// 		res.send('Please enter user and Password!');
// 		res.end();
// 	}
// });
