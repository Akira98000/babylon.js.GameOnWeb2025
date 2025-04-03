/**
 * Système de notification pour l'état de connexion des manettes
 */

export class GamepadNotification {
    /**
     * Crée une notification pour l'état de connexion des manettes
     * @param {string} message - Le message à afficher
     * @param {string} type - Le type de notification ('connected' ou 'disconnected')
     * @param {number} duration - Durée d'affichage en millisecondes
     */
    static show(message, type = 'connected', duration = 3000) {
        // Supprimer les notifications existantes
        const existingNotifications = document.querySelectorAll('.gamepad-notification');
        existingNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = 'gamepad-notification';
        notification.textContent = message;
        
        // Définir le style de la notification
        Object.assign(notification.style, {
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: type === 'connected' ? 'rgba(50, 205, 50, 0.7)' : 'rgba(220, 20, 60, 0.7)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            zIndex: '1000',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
            fontWeight: 'bold',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });
        
        // Ajouter une icône de manette
        const icon = document.createElement('span');
        icon.innerHTML = type === 'connected' ? '🎮 ' : '❌ 🎮 ';
        notification.insertBefore(icon, notification.firstChild);
        
        // Ajouter la notification au DOM
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Supprimer la notification après la durée spécifiée
        setTimeout(() => {
            notification.style.opacity = '0';
            
            // Supprimer du DOM après la fin de l'animation
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        return notification;
    }
} 