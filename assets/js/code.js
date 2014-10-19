$(document).ready(function(){
    // Compatibility shim
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // PeerJS object
    var peer = new Peer({ key: 'lwjd5qra8257b9', debug: 3 });

    peer.on('open', function(){
      $('#my-id').text(peer.id);
    });

    peer.on('connection', connect);

    // Receiving a call
    peer.on('call', function(call){
      // Answer the call automatically (instead of prompting user) for demo purposes
      call.answer(window.localStream);
      step3(call);
    });
    peer.on('error', function(err){
      alert(err.message);
      // Return to step 2 if error occurs
      step2();
    });

    // Click handlers setup
    $(function(){
      $('#make-call').click(function(){
        // Initiate a call!
        var call = peer.call($('#callto-id').val(), window.localStream);
        var c = peer.connect($('#callto-id').val(), {
          label: 'chat',
          serialization: 'none',
          reliable: false,
          metadata: {message: 'hi i want to chat with you!'}
        });
        c.on('open', function() {
          connect(c);
        });
        c.on('error', function(err) { alert(err); });

        var f = peer.connect($('#callto-id').val(), { label: 'code' });
        f.on('open', function() {
          connect(f);
        });
        f.on('error', function(err) { alert(err); });
        step3(call);
      });

      $('#end-call').click(function(){
        window.existingCall.close();
        step2();
      });

      // Retry if getUserMedia fails
      $('#step1-retry').click(function(){
        $('#step1-error').hide();
        step1();
      });

      // Get things started
      step1();
    });

    function step1 () {
      // Get audio/video stream
      navigator.getUserMedia({audio: true, video: true}, function(stream){
        // Set your video displays
        $('#my-video').prop('src', URL.createObjectURL(stream));

        window.localStream = stream;
        step2();
      }, function(){ $('#step1-error').show(); });
    }

    function step2 () {
      $('#step1, #step3').hide();
      $('#step2').show();
    }

    function step3 (call) {
      // Hang up on an existing call if present
      if (window.existingCall) {
        window.existingCall.close();
      }

      // Wait for stream on the call, then set peer video display
      call.on('stream', function(stream){
        $('#their-video').prop('src', URL.createObjectURL(stream));
      });

      // UI stuff
      window.existingCall = call;
      $('#their-id').text(call.peer);
      call.on('close', step2);
      $('#step1, #step2').hide();
      $('#step3').show();
    }

//send
$('#send').submit(function(e) {
    e.preventDefault();
    // For each active connection, send the message.
    var msg = $('#chat').val();
      console.log(msg)
    if (msg == ''){
      return;
    }
    eachActiveConnection(function(c, $c) {
      if (c.label === 'chat') {
        c.send(msg);
        $c.find('.messages').append('<div style="border-bottom:1px solid #777;min-height:20px;padding:10px;min-height:30px"><span class="you">You: </span>' + msg
          + '</div>');
      }
    });
    $('#chat').val('');
    $('#chat').focus();
  });


    submitCode = function(sentinel){
      if(sentinel != 'sentinel'){
        eachActiveConnection(function(c, $c) {
          if (c.label === 'code') {
            c.send('\\\\\\\\\\\\\\\\\\\\\\\\\\\\Send////////////');
          }
        });
      }
      $.ajax({
        url:'/api/code',
        type: "POST",
        data: { code: editor.getValue(), s:'aaaa' }
      })
      .done(function(data){
        console.log(data);
        if(data.err)
        {
          editor2.setValue(editor2.getValue()+ '\n>>>' + '\n' + data.err, 1)
          return;
        }
        if(editor2.getValue() == '')
          editor2.setValue('>>>' + '\n' + data.results.join('\n'), 1);
        else
        editor2.setValue(editor2.getValue() + '\n>>>\n' + data.results.join('\n'), 1);
      })
      .error(function(data){
        console.log('error');
      })
      console.log(editor.getValue());
    }


  // Goes through each active peer and calls FN on its connections.
  function eachActiveConnection(fn) {
    var actives = $('.active');
    var checkedIds = {};
    actives.each(function() {
      var peerId = $(this).attr('id');

      if (!checkedIds[peerId]) {
        var conns = peer.connections[peerId];
        for (var i = 0, ii = conns.length; i < ii; i += 1) {
          var conn = conns[i];
          fn(conn, $(this));
        }
      }

      checkedIds[peerId] = 1;
    });
  }
var wait = 0;
setInterval(function(){
  wait--;
},1000)
function setNewEditorValue(data){
  wait = 1;
  editor.setValue(data, 1);
}
editor.on('input', function() {
  console.log('input');
  if(wait > 0)
    return;

  //;
  //if(xbnhhn9is899hpvi)
  eachActiveConnection(function(c, $c) {
    if (c.label === 'code') {
      c.send(editor.getValue());
      //$c.find('.messages').append('<div><span class="file">You sent a file.</span></div>');
    }
  });
});

// Handle a connection object.
function connect(c) {
  console.log(c);
  // Handle a chat connection.
  if (c.label === 'chat') {
    var chatbox = $('#chatbox').addClass('connection').addClass('active').attr('id', c.peer);
    var messages = $('<div><em></em></div>').addClass('messages');
    chatbox.append(messages);

    // Select connection handler.
    chatbox.on('click', function() {
      if ($(this).attr('class').indexOf('active') === -1) {
        $(this).addClass('active');
      } else {
        $(this).removeClass('active');
      }
    });
    $('.filler').hide();
    $('#connections').append(chatbox);

    c.on('data', function(data) {
      messages.append('<div style="border-bottom:1px solid #777;min-height:20px;padding:10px;min-height:30px"><span class="peer"> Other </span>: ' + data +
        '</div>');
        });
        c.on('close', function() {
          alert(c.peer + ' has left the chat.');
          chatbox.remove();
          if ($('.connection').length === 0) {
            $('.filler').show();
          }
          delete connectedPeers[c.peer];
        });
  } else if (c.label === 'code') {
    c.on('data', function(data) {
      if(data == '\\\\\\\\\\\\\\\\\\\\\\\\\\\\Send////////////'){
        submitCode('sentinel'); return;
      }
      console.log(data);
      if(editor.getValue() != data)
        setNewEditorValue(data);
    });

  }
}

})

window.addEventListener("keydown", keysPressed, false);
window.addEventListener("keyup", keysReleased, false);

var keys = [];

function keysPressed(e) {
    // store an entry for every key pressed
    keys[e.keyCode] = true;

    console.log(e.keyCode);
    // Ctrl + s
    if (keys[17] && keys[83] || keys[91] && keys[83]) {
      submitCode();
        // do something
        e.preventDefault();
    }
}

function keysReleased(e) {
    // mark keys that were released
    keys[e.keyCode] = false;
}

    var editor2 = ace.edit("editor2");
    editor2.setTheme("ace/theme/terminal");
    editor2.getSession().setMode("ace/mode/python");
    editor2.setReadOnly(true);

    editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/python");
    editor.getSession().setUseWrapMode(true);
