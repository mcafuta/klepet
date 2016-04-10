function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var img = sporocilo.indexOf("<img class='img'") > -1;
  var video = sporocilo.indexOf("<iframe class='video'") > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } 
  else if (img || video) {
    //if(img && video){
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').
                                replace(new RegExp('&lt;img',"g"), '<div><img').replace(new RegExp('png\' /&gt;', "g"), 'png\' /></div>').
                                replace(new RegExp('jpg\' /&gt;', "g"), 'jpg\' /></div>').replace(new RegExp('gif\' /&gt;', "g"), 'gif\' /></div>').
                                replace(new RegExp('&lt;iframe',"g"), '<div><iframe').replace(new RegExp('allowfullscreen&gt;', "g"), 'allowfullscreen>').
                                replace(new RegExp('&lt;/iframe&gt;', "g"), '</iframe></div>');
    //}
    //else if(img){
    /*sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').
                                replace(new RegExp('&lt;img',"g"), '<br><img').replace('png\' /&gt;', 'png\' /><br>').
                                replace(new RegExp('jpg\' /&gt;', "g"), 'jpg\' /><br>').replace('gif\' /&gt;', 'gif\' /><br>');   */
    /*                            
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').
                                replace(new RegExp('&lt;img',"g"), '<div><img').replace(new RegExp('png\' /&gt;', "g"), 'png\' /></div>').
                                replace(new RegExp('jpg\' /&gt;', "g"), 'jpg\' /></div>').replace(new RegExp('gif\' /&gt;', "g"), 'gif\' /></div>');
    //}
    //else if (video) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(new RegExp('&lt;iframe',"g"), '<div><iframe').
                          replace(new RegExp('allowfullscreen&gt;', "g"), 'allowfullscreen>').replace(new RegExp('&lt;/iframe&gt;', "g"), '</iframe></div>');
    console.log(sporocilo);
  //} */
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  sporocilo = dodajSliko(sporocilo);
  sporocilo = dodajVideo(sporocilo);

  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {
      //klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').val('/zasebno \"' + $(this).text()+'\" ');
      $('#poslji-sporocilo').focus();
    });
  });



  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}


function dodajSliko(vhodnoBesedilo) {
  //  http:// ali https:// , .jpg, .png ali .gif
  //var image = /(https?:\/\/.*\.(?:\.png|\.jpg|\.gif))/ig;
  var regex = new RegExp("^(https?://.*\.(?:.png|.jpg|.gif)$)","gi");
  var regex2 = new RegExp("^(http|https)://\.*(.png|.jpg|.gif)$", "gi");
  var attachments = "";
  msg = vhodnoBesedilo.split(' ');
  for(w in msg){
    //msg[w].match(regex)
    msg[w] = msg[w].replace(regex, function(url){
      //return url+"\n<img class='img', src='" + url + "' />";
      attachments += "<img class='img', src='" + url + "' />" + " ";
      return url;
    });
  }
  console.log(msg + " " + attachments);
  //return msg.join(' ');
  return msg.join(' ') +" "+ attachments;
}

function dodajVideo(vhodnoBesedilo) {
  //https://www.youtube.com/watch?v={video}
  ///http\:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})/;
  var regex = /https:\/\/www\.youtube\.com\/watch\?v=([^\s]*)/gi;
  var attachments = " ";
  msg = vhodnoBesedilo.split(' ');
  for(w in msg){
    msg[w] = msg[w].replace(regex, function(url){
      //return url+"\n<img class='img', src='" + url + "' />";

      attachments += "<iframe class='video' src='";
      var url_cpy = url.replace("watch?v=", "v/");
      attachments += url_cpy;
      attachments += "' allowfullscreen> </iframe>" + " ";
      return url;
    });
  }
  console.log(msg);
  console.log(attachments);
  //return msg.join(' ');
  return msg.join(' ') +" "+ attachments;
}