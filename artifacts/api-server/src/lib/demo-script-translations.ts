import type { DemoNuggetId, DemoScriptLocale } from "@workspace/api-zod";

/**
 * Editorial translations of the fixed English scripts, not runtime translation.
 * Review alongside the English source: retain simulation, configuration, source
 * review, privacy and no-action qualifiers. Product names remain unchanged.
 * Complete records make new stages/locales a deliberate editorial change.
 */
type ScriptTranslation = Record<DemoNuggetId, Record<string, string>>;
export const DEMO_SCRIPT_TRANSLATIONS: Record<Exclude<DemoScriptLocale, "en-US">, ScriptTranslation> = {
  "es-ES": {
    "voice-copilot": {
      connected: "Hola, soy Terry. Quisiera devolver el pedido que llegó ayer. ¿Podría ayudarme?",
      intent: "En este ejemplo preparado, una solicitud de devolución y una transcripción de muestra aparecen junto al contexto del cliente.",
      knowledge: "Se muestra un artículo ilustrativo sobre devoluciones y reembolsos para que el agente lo revise. La disponibilidad real depende de la configuración.",
      guidance: "Consultaré su pedido, revisaré las condiciones de devolución y le explicaré los siguientes pasos. Primero verificaré esos datos.",
      "wrap-up": "El agente humano revisa la orientación sugerida y su fuente antes de responder. En esta simulación no se realiza ninguna devolución ni cambio en la cuenta.",
    },
    "voice-qa": {
      conversation: "Quisiera devolver una bolsa de café de mi último pedido, por favor.",
      review: "Por supuesto. Tengo su número de pedido: quince mil veintitrés. Permítame revisar los detalles con usted.",
      risk: "Este ejemplo preparado de revisión de calidad destaca un posible seguimiento para la retención del cliente. Es un aspecto destacado ilustrativo, no una evaluación real.",
      product: "Un ejemplo de aspecto destacado sobre un problema con un producto ayuda al revisor a identificar una conversación que examinar. No se carga ni se analiza ninguna grabación.",
      service: "El último aspecto destacado de muestra reconoce la rápida confirmación del pedido por parte del agente. Las funciones de calidad requieren el producto y la configuración correspondientes.",
    },
    "voice-ai-agents": {
      request: "Mi pedido llegó dañado. ¿Podrían enviarme un reemplazo y recoger el artículo original?",
      confirmation: "Puedo guiarle por los pasos para un reemplazo y una recogida. ¿Desea continuar con esa opción?",
      replacement: "Una acción preparada ilustra la creación de un reemplazo. Esta simulación no modifica ningún pedido.",
      pickup: "A continuación, le mostraré el paso de recogida y confirmaré los detalles con usted.",
      notification: "El ejemplo termina con una confirmación ilustrativa. En realidad, no se crea ningún reemplazo ni recogida, ni se envía ninguna notificación.",
    },
    "video-screen-sharing": {
      invitation: "Veámoslo juntos. Le enviaré una invitación de vídeo aquí en el chat. Puede unirse cuando quiera.",
      preview: "He abierto la invitación. Comprobaré la cámara y el micrófono en la vista previa antes de unirme.",
      connected: "El cliente y el agente se reúnen en una videollamada desde el navegador. El ticket original y el contexto del cliente permanecen junto a la conversación.",
      "select-screen": "Seleccione la ventana de configuración del dispositivo que desea compartir. Comparta solo lo que quiera mostrarme y mantenga la información privada fuera de la vista.",
      sharing: "Se comparte la ventana seleccionada mientras los vídeos de los participantes siguen visibles. El agente guía al cliente por la configuración del dispositivo.",
      resolution: "Ha funcionado. Mi dispositivo ya está conectado. Gracias por ayudarme con la configuración.",
    },
  },
  "fr-FR": {
    "voice-copilot": {
      connected: "Bonjour, je m'appelle Terry. Je voudrais retourner la commande arrivée hier. Pourriez-vous m'aider ?",
      intent: "Dans cet exemple préparé, une demande de retour et un exemple de transcription s'affichent à côté du contexte client.",
      knowledge: "Un article illustratif sur les retours et les remboursements est présenté à l'agent pour examen. Sa disponibilité réelle dépend de la configuration.",
      guidance: "Je vais consulter votre commande, vérifier les conditions de retour et vous expliquer les prochaines étapes. Permettez-moi d'abord de vérifier ces informations.",
      "wrap-up": "L'agent humain examine les conseils suggérés et leur source avant de répondre. Aucun retour ni aucune modification de compte n'est effectué dans cette simulation.",
    },
    "voice-qa": {
      conversation: "Je voudrais retourner un sachet de café de ma dernière commande, s'il vous plaît.",
      review: "Bien sûr. J'ai votre numéro de commande : quinze mille vingt-trois. Permettez-moi d'en examiner les détails avec vous.",
      risk: "Cet exemple préparé de contrôle qualité met en évidence un éventuel suivi de fidélisation du client. Il s'agit d'une mise en avant illustrative, et non d'une évaluation réelle.",
      product: "Un exemple de mise en avant d'un problème produit aide la personne chargée du contrôle à repérer une conversation à examiner. Aucun enregistrement n'est importé ni analysé.",
      service: "Le dernier exemple met en avant la confirmation rapide de la commande par l'agent. Les fonctionnalités de qualité nécessitent le produit et la configuration correspondants.",
    },
    "voice-ai-agents": {
      request: "Ma livraison est arrivée endommagée. Pourrais-je obtenir un remplacement et faire récupérer l'article d'origine ?",
      confirmation: "Je peux vous guider dans les étapes de remplacement et de collecte. Souhaitez-vous poursuivre avec cette option ?",
      replacement: "Une action préparée illustre la création d'un remplacement. Cette simulation ne modifie aucune commande.",
      pickup: "Je vais maintenant vous montrer l'étape de collecte et en confirmer les détails avec vous.",
      notification: "L'exemple se termine par une confirmation illustrative. En réalité, aucun remplacement ni aucune collecte n'est créé, et aucune notification n'est envoyée.",
    },
    "video-screen-sharing": {
      invitation: "Regardons cela ensemble. Je vais vous envoyer une invitation vidéo ici, dans le chat. Vous pourrez rejoindre l'appel quand vous le souhaiterez.",
      preview: "J'ai ouvert l'invitation. Je vais vérifier ma caméra et mon microphone dans l'aperçu avant de rejoindre l'appel.",
      connected: "Le client et l'agent se retrouvent lors d'un appel vidéo dans le navigateur. Le ticket d'origine et le contexte client restent affichés à côté de la conversation.",
      "select-screen": "Veuillez choisir la fenêtre de configuration de l'appareil à partager. Ne partagez que ce que vous souhaitez me montrer et gardez les informations privées hors de vue.",
      sharing: "La fenêtre sélectionnée est partagée tandis que les vidéos des participants restent visibles. L'agent guide le client dans les paramètres de l'appareil.",
      resolution: "Cela a fonctionné. Mon appareil est maintenant connecté. Merci de m'avoir aidé à le configurer.",
    },
  },
};
