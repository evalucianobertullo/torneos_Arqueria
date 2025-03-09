// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar tooltips de Bootstrap
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Auto-cerrar alertas después de 5 segundos
  setTimeout(function() {
    var alerts = document.querySelectorAll('.alert');
    alerts.forEach(function(alert) {
      if (bootstrap.Alert) {
        var bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      } else {
        // Fallback si bootstrap no está disponible
        alert.style.display = 'none';
      }
    });
  }, 5000);

  // Confirmar acciones peligrosas
  var dangerButtons = document.querySelectorAll('.btn-danger');
  dangerButtons.forEach(function(button) {
    button.addEventListener('click', function(e) {
      if (!confirm('¿Estás seguro de que deseas realizar esta acción?')) {
        e.preventDefault();
      }
    });
  });
  
  // Mejoras para input en dispositivos móviles
  var inputs = document.querySelectorAll('input, select');
  inputs.forEach(function(input) {
    // Al enfocar un input, scroll a ese elemento para evitar que el teclado lo oculte
    input.addEventListener('focus', function() {
      setTimeout(function() {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    });
    
    // Detectar si estamos en un dispositivo móvil
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // En dispositivos iOS, prevenir zoom al enfocar inputs pequeños
      if (input.type === 'text' || input.type === 'number' || input.type === 'email' || input.type === 'password') {
        input.style.fontSize = '16px';
      }
    }
  });
  
  // Añadir clase al body para detectar si es dispositivo móvil
  if (window.innerWidth <= 768) {
    document.body.classList.add('mobile-device');
  }
  
  // Ajustar altura en dispositivos móviles para forms
  function adjustFormHeight() {
    if (window.innerWidth <= 768) {
      var forms = document.querySelectorAll('form');
      forms.forEach(function(form) {
        form.style.minHeight = window.innerHeight * 0.6 + 'px';
      });
    }
  }
  
  // Llamar al ajuste de altura inicialmente
  adjustFormHeight();
  
  // Y también cuando cambie el tamaño de la ventana
  window.addEventListener('resize', adjustFormHeight);
}); 