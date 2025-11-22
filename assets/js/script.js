// ---------- utilidades ----------
function getSaldo() {
  var s = parseFloat(localStorage.getItem('saldo'));
  if (isNaN(s)) return 0;
  return s;
}

function setSaldo(monto) {
  localStorage.setItem('saldo', monto.toString());
}

function getTransacciones() {
  var t = localStorage.getItem('transacciones');
  if (!t) return []; /* if (!t) return [];

Si t es null o vacío (no hay nada guardado), devolvemos un array vacío [].

Es decir: “no hay transacciones aún”. */
  try {
    return JSON.parse(t);
  } catch (e) {
    return [];
  }
}

function setTransacciones(lista) {
  localStorage.setItem('transacciones', JSON.stringify(lista));
}/* JSON.stringify(lista)

Convierte ese array a texto (JSON) para poder guardarlo.*/

function addTransaccion(tipo, monto) {
  var lista = getTransacciones();
  lista.push({
    tipo: tipo,
    monto: monto,
    fecha: new Date().toISOString()
  });
  setTransacciones(lista);
}

function tipoLabel(tipo) {
  if (tipo === 'deposito') return 'Depósito';
  if (tipo === 'transferencia_enviada') return 'Transferencia enviada';
  return tipo;
}

// ---------- ready ----------
$(document).ready(function () {

  // ========== LOGIN ==========
  if ($('#loginForm').length) {
    $('#loginForm').submit(function (event) {
      event.preventDefault();

      var username = $('#username').val().trim();
      var password = $('#password').val().trim();
      $('#loginAlert').empty();

      if (!username || !password) {
        $('#loginAlert').html(
          '<div class="alert alert-danger">Completa usuario y contraseña.</div>'
        );
        return;
      }

      if (username === 'admin' && password === '12345') {
        // inicializa saldo y transacciones si no existen
        if (localStorage.getItem('saldo') === null) {
          setSaldo(0);
          setTransacciones([]);
        }

        $('#loginAlert').html(
          '<div class="alert alert-success">Login correcto. Redirigiendo al menú...</div>'
        );

        setTimeout(function () {
          window.location.href = 'menu.html';
        }, 1000);
      } else {
        $('#loginAlert').html(
          '<div class="alert alert-danger">Usuario o contraseña inválidos.</div>'
        );
      }
    });
  }

  // ========== MENÚ PRINCIPAL ==========
  if ($('#balanceMenu').length) {
    $('#balanceMenu').text(getSaldo().toFixed(2));

    $('#goDeposit').click(function () {
      $('#menuAlert').html(
        '<div class="alert alert-info">Redirigiendo a depósito...</div>'
      );
      setTimeout(function () {
        window.location.href = 'deposit.html';
      }, 800);
    });

    $('#goSendMoney').click(function () {
      $('#menuAlert').html(
        '<div class="alert alert-info">Redirigiendo a enviar dinero...</div>'
      );
      setTimeout(function () {
        window.location.href = 'sendmoney.html';
      }, 800);
    });

    $('#goTransactions').click(function () {
      $('#menuAlert').html(
        '<div class="alert alert-info">Redirigiendo a últimos movimientos...</div>'
      );
      setTimeout(function () {
        window.location.href = 'transactions.html';
      }, 800);
    });
  }

  // ========== DEPÓSITO ==========
  if ($('#depositForm').length) {
    $('#balanceDeposit').text(getSaldo().toFixed(2));

    $('#depositForm').submit(function (e) {
      e.preventDefault();
      $('#depositAlert').empty();

      var amount = parseFloat($('#depositAmount').val());
      if (isNaN(amount) || amount <= 0) {
        $('#depositAlert').html(
          '<div class="alert alert-danger">Ingresa un monto válido.</div>'
        );
        return;
      }

      var nuevoSaldo = getSaldo() + amount;
      setSaldo(nuevoSaldo);
      addTransaccion('deposito', amount);

      $('#balanceDeposit').text(nuevoSaldo.toFixed(2));
      $('#depositText').text('Has depositado $ ' + amount.toFixed(2));

      $('#depositAlert').html(
        '<div class="alert alert-success">Depósito realizado con éxito.</div>'
      );

      setTimeout(function () {
        window.location.href = 'menu.html';
      }, 2000);
    });
  }

  // ========== ENVIAR DINERO ==========
  if ($('#balanceSend').length) {
    $('#balanceSend').text(getSaldo().toFixed(2));

    // mostrar/ocultar formulario nuevo contacto
    $('#showNewContactForm').click(function () {
      $('#newContactForm').slideDown();
    });

    $('#cancelNewContact').click(function (e) {
      e.preventDefault();
      $('#newContactForm').slideUp();
    });

    // agregar contacto
    $('#addContactForm').submit(function (e) {
      e.preventDefault();
      $('#sendAlert').empty();

      var nombre = $('#newContactName').val().trim();
      var alias = $('#newContactAlias').val().trim();

      if (!nombre || !alias) {
        $('#sendAlert').html(
          '<div class="alert alert-danger">Completa nombre y alias/CBU.</div>'
        );
        return;
      }

      $('#contactsList').append(
        '<li class="list-group-item contact-item" data-name="' + nombre + '">' +
        nombre + ' - ' + alias + '</li>'
      );

      $('#sendAlert').html(
        '<div class="alert alert-success">Contacto agregado.</div>'
      );

      $('#addContactForm')[0].reset();
      $('#newContactForm').slideUp();
    });

    // seleccionar contacto -> mostrar botón enviar
    $('#contactsList').on('click', '.contact-item', function () {
      $('.contact-item').removeClass('active');
      $(this).addClass('active');
      $('#sendMoneyBtn').removeClass('d-none');
    });

    // búsqueda
    $('#searchForm').submit(function (e) {
      e.preventDefault();
      var term = $('#searchContact').val().toLowerCase();

      $('.contact-item').each(function () {
        var text = $(this).text().toLowerCase();
        $(this).toggle(text.indexOf(term) !== -1);
      });
    });

    // enviar dinero
    $('#sendMoneyBtn').click(function () {
      $('#sendAlert').empty();

      var selected = $('.contact-item.active');
      var amount = parseFloat($('#sendAmount').val());

      if (!selected.length) {
        $('#sendAlert').html(
          '<div class="alert alert-danger">Selecciona un contacto.</div>'
        );
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        $('#sendAlert').html(
          '<div class="alert alert-danger">Ingresa un monto válido.</div>'
        );
        return;
      }

      var saldo = getSaldo();
      if (amount > saldo) {
        $('#sendAlert').html(
          '<div class="alert alert-danger">Saldo insuficiente.</div>'
        );
        return;
      }

      var nombre = selected.data('name');
      setSaldo(saldo - amount);
      addTransaccion('transferencia_enviada', amount);

      $('#balanceSend').text(getSaldo().toFixed(2));
      $('#sendAmount').val('');

      $('#sendAlert').html(
        '<div class="alert alert-success">Envío realizado con éxito a ' +
        nombre + '.</div>'
      );
    });
  }

  // ========== ÚLTIMOS MOVIMIENTOS ==========
  if ($('#transactionsList').length) {
    $('#balanceTransactions').text(getSaldo().toFixed(2));

    function renderMovimientos(filtro) {
      var lista = getTransacciones();
      $('#transactionsList').empty();

      lista.forEach(function (t) {
        if (filtro === 'todos' || t.tipo === filtro) {
          var li = $('<li class="list-group-item"></li>');
          li.text(tipoLabel(t.tipo) + ' - $ ' +
                  Number(t.monto).toFixed(2));
          $('#transactionsList').append(li);
        }
      });

      if ($('#transactionsList').children().length === 0) {
        $('#transactionsList').append(
          '<li class="list-group-item">No hay movimientos para mostrar.</li>'
        );
      }
    }

    renderMovimientos('todos');

    $('#filterType').change(function () {
      renderMovimientos($(this).val());
    });
  }

});
