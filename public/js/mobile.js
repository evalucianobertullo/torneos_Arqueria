/**
 * Mejoras específicas para dispositivos móviles
 */
document.addEventListener('DOMContentLoaded', function() {
  // Detectar si estamos en un dispositivo móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  
  if (isMobile) {
    // Añadir clase al body para estilos específicos
    document.body.classList.add('mobile-device');
    
    // Mejorar la experiencia de pulsación en botones
    const buttons = document.querySelectorAll('button, .btn, a.nav-link');
    buttons.forEach(button => {
      // Efecto visual al tocar
      button.addEventListener('touchstart', function() {
        this.classList.add('touch-active');
      });
      
      button.addEventListener('touchend', function() {
        this.classList.remove('touch-active');
        // Añadir un pequeño retraso para mejorar la experiencia visual
        setTimeout(() => {
          this.blur();
        }, 300);
      });
    });
    
    // Mejorar la interacción con los campos de formulario
    const formFields = document.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
      // Cuando un campo recibe el foco, añadir clase a su contenedor
      field.addEventListener('focus', function() {
        // Buscar el contenedor del input (normalmente un div)
        let parent = this.parentElement;
        if (parent.classList.contains('input-group')) {
          parent.classList.add('focused-input');
        }
        
        // Asegurar que el campo es visible al escribir
        setTimeout(() => {
          // Scroll suave hacia el elemento para evitar que el teclado lo oculte
          this.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      });
      
      field.addEventListener('blur', function() {
        // Quitar clase de foco
        let parent = this.parentElement;
        if (parent.classList.contains('input-group')) {
          parent.classList.remove('focused-input');
        }
      });
    });
    
    // Añadir validación en tiempo real para formularios
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select');
      
      inputs.forEach(input => {
        input.addEventListener('input', function() {
          // Validar campos requeridos
          if (this.hasAttribute('required') && this.value.trim() === '') {
            this.classList.add('is-invalid');
          } else {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
          }
          
          // Validación específica para confirmación de contraseña
          if (this.id === 'confirmPassword') {
            const password = document.getElementById('password');
            if (password && this.value !== password.value) {
              this.classList.add('is-invalid');
              this.setCustomValidity('Las contraseñas no coinciden');
            } else {
              this.classList.remove('is-invalid');
              this.setCustomValidity('');
            }
          }
        });
      });
    });
  }
}); 