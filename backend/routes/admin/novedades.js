var express = require('express');
var router = express.Router();
var novedadesModel = require('../../bin/models/novedadesModel');
const util = require('util');
const cloudinary = require('cloudinary').v2;
const uploader = util.promisify(cloudinary.uploader.upload);
const destroy = util.promisify(cloudinary.uploader.destroy);


/* GET home page. */
router.get('/', async function(req, res, next) {
  console.log("login test")

  var novedades = await novedadesModel.getNovedades();

novedades = novedades.map(novedad => { 
  if (novedad.img_id) {
    const imagen = cloudinary.image(novedad.img_id, {
      width: 100,
      height: 100,
      crop: 'fill' // podes usar pad
    });
    return {
      ...novedad,
      imagen
    }
  } else {
    return {
      ...novedad,
      imagen:''
    }
  }
});

  res.render('admin/novedades',{
      layout:'admin/layout',
      persona: req.session.nombre, 
      novedades
  });
});

router.get('/agregar', (req, res, next) => {
  res.render('admin/agregar', {
    layout: 'admin/layout'
  })
});

router.post('/agregar', async (req, res, next) => {
  try {
        var img_id = '';
        console.log(req.files.imagen);

        if (req.files && Object.keys(req.files).length > 0) {
          imagen = req.files.imagen;
          img_id = (await uploader(imagen.tempFilePath)).public_id;
          // console.log("ID:  "+img_id)
        }


    if (req.body.titulo != "" && req.body.subtitulo != "" && req.body.cuerpo != "") {
      await novedadesModel.insertNovedad({
        ...req.body,        // titulo, subtitulo y cuerpo
        img_id
      });
      res.redirect('/admin/novedades')
    } else {
      res.render('admin/agregar', {
        layout: 'admin/layout',
        error: true,
        message: 'Todos los campos son requeridos'
      })
    }
  } catch (error) {
    console.log(error)
    res.render('admin/agregar', {
      layout: 'admin/layout',
      error: true,
      message: 'No se cargo la novedad'
    })
  }
});


router.get('/eliminar/:id', async (req, res, next) => {
  var id = req.params.id;

  let novedad = await novedadesModel.getNovedadById(id);
  if (novedad.img_id) {
    await (destroy (novedad.img_id));
  }

  await novedadesModel.deleteNovedadesByID(id);
  res.redirect('/admin/novedades');
  
});

router.get('/modificar/:id', async (req, res, next) => {
  var id = req.params.id;
  console.log(req.params.id);
  var novedad = await novedadesModel.getNovedadById(id);
  console.log("success")
  res.render('admin/modificar', {
    layout: 'admin/layout',
    novedad
  })
});

router.post('/modificar', async (req, res, next) => {
  try {
      let img_id = req.body.img_original;
      let borrar_img_vieja = false;
      console.log("HERE: "+img_id)
      if (req.body.img_delete === "1") {
        console.log("yes")
        img_id = null;
        borrar_img_vieja = true;
      } else {
        if (req.files && Object.keys(req.files).length > 0){
          imagen = req.files.imagen;
          img_id = (await uploader(imagen.tempFilePath)).public_id;
          borrar_img_vieja = true;
        }
      }
      if (borrar_img_vieja && req.body.img_original) {
        console.log("teeeeeeest3")
        await (destroy(req.body.img_original));
      }
    
    var obj = {
      titulo: req.body.titulo,
      subtitulo: req.body.subtitulo,
      cuerpo: req.body.cuerpo,
      img_id
    }
    console.log(obj)

    await novedadesModel.modificarNovedadById(obj,req.body.id);
    res.redirect ('/admin/novedades');
  
  } catch (error) {
    console.log(error)
    // res.render('admin/modificar', {
    //   layour: 'admin/layout',
    //   error: true,
    //   message: 'No se modifico la novedad'
    // })
  }
})


module.exports = router;