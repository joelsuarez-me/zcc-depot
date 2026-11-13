import type { DemoStage } from "@/lib/demo-playback";
import type { DemoScriptLocale } from "@workspace/api-client-react";

export type NuggetId = "voice-copilot" | "voice-qa" | "voice-ai-agents" | "video-screen-sharing";
export type DemoNugget = { id: NuggetId; title: string; description: string; stages: readonly DemoStage[] };

/** Prepared visual sequences; optional ElevenLabs speech is synthetic, not a call. */
export const DEMO_NUGGETS = [
  {
    id: "voice-copilot",
    title: "Voice Copilot",
    description: "Follow a sample returns call as customer context, conversation intent and knowledge guidance come together for the agent.",
    stages: [
      { id: "connected", label: "Call connected", description: "Terry asks for help returning an order. The agent sees the customer and call context.", durationMs: 2500 },
      { id: "intent", label: "Intent recognized", description: "A sample transcript reveals a returns request and neutral sentiment.", durationMs: 3000 },
      { id: "knowledge", label: "Knowledge surfaced", description: "An illustrative returns-and-refunds article is surfaced alongside the conversation.", durationMs: 3000 },
      { id: "guidance", label: "Guidance presented", description: "The copilot outlines the order check, return request and submission steps for the human agent.", durationMs: 4000 },
      { id: "wrap-up", label: "Agent ready to respond", description: "The suggested response and source stay visible. The human agent decides what to do next.", durationMs: 2500 },
    ],
  },
  {
    id: "voice-qa",
    title: "Voice QA",
    description: "Review a sample voice conversation and explore illustrative spotlights for churn risk, product issues and exceptional service.",
    stages: [
      { id: "conversation", label: "Conversation captured", description: "A sample customer asks to return a bag of coffee; the agent confirms order 15023.", durationMs: 3000 },
      { id: "review", label: "Conversation reviewed", description: "An illustrated quality review examines the sample conversation. No recording is uploaded or analyzed.", durationMs: 3000 },
      { id: "risk", label: "Churn risk spotlight", description: "A sample spotlight highlights a possible customer-retention follow-up, not a real assessment.", durationMs: 3000 },
      { id: "product", label: "Product issue spotlight", description: "An illustrative flag identifies a product-related follow-up for review.", durationMs: 3000 },
      { id: "service", label: "Exceptional service spotlight", description: "The final sample spotlight recognizes the agent confirming the order promptly.", durationMs: 3000 },
    ],
  },
  {
    id: "voice-ai-agents",
    title: "Voice AI Agents",
    description: "Follow a sample replacement conversation as an AI voice agent confirms the request and illustrates a coordinated resolution.",
    stages: [
      { id: "request", label: "Request understood", description: "A customer asks to replace a damaged item.", durationMs: 2500 },
      { id: "confirmation", label: "Customer confirms", description: "The customer agrees to a replacement and collection of the original item.", durationMs: 3000 },
      { id: "replacement", label: "Replacement created", description: "A simulated action marks the replacement as created. No order is actually changed.", durationMs: 3000 },
      { id: "pickup", label: "Pickup scheduled", description: "A second simulated action illustrates arranging a carrier pickup.", durationMs: 3000 },
      { id: "notification", label: "Confirmation sent", description: "A final simulated action illustrates sending the details. No email or notification is actually sent.", durationMs: 3500 },
    ],
  },
  {
    id: "video-screen-sharing",
    title: "Video calling & screen sharing",
    description: "Escalate a sample messaging conversation to video, preview audio and camera, and guide a customer through a shared setup window without losing ticket context.",
    stages: [
      { id: "invitation", label: "Invite from the ticket", description: "The human agent sends a video invitation in the existing messaging conversation.", durationMs: 4000 },
      { id: "preview", label: "Preview before joining", description: "Both participants can check audio and video before joining the browser-based call.", durationMs: 4000 },
      { id: "connected", label: "Connect on video", description: "The customer and agent meet on video while their ticket context stays visible.", durationMs: 4000 },
      { id: "select-screen", label: "Choose a window", description: "Select a prepared setup window to share. No real screen capture takes place.", durationMs: 4000 },
      { id: "sharing", label: "Guide with visual context", description: "The selected window and participant video remain visible together.", durationMs: 5000 },
      { id: "resolution", label: "Resolve in context", description: "The sample device is paired and the conversation remains on the same ticket.", durationMs: 4000 },
    ],
  },
] as const satisfies readonly DemoNugget[];

type LocalizedNuggets = {
  [N in typeof DEMO_NUGGETS[number] as N["id"]]: {
    description: string;
    stages: { [S in N["stages"][number]["id"]]: readonly [label: string, description: string] };
  };
};

/**
 * Editorial scene copy, reviewed against demo-script-translations.ts.
 * IDs/order/timing are inherited from English; these are prepared examples,
 * never translations of external source documents or live product UI.
 */
export const DEMO_SCENE_TRANSLATIONS = {
  "es-ES": {
    "voice-copilot": {
      description: "Siga una llamada de devolución de muestra: el agente consulta el contexto del cliente, la intención de la conversación y la orientación de conocimiento.",
      stages: {
        connected: ["Llamada conectada", "Terry pide ayuda para devolver un pedido. El agente ve el contexto del cliente y de la llamada."],
        intent: ["Intención reconocida", "Una transcripción de muestra presenta una solicitud de devolución y un sentimiento neutro."],
        knowledge: ["Artículo mostrado", "Se muestra un artículo ilustrativo sobre devoluciones y reembolsos junto a la conversación. La disponibilidad depende de la configuración."],
        guidance: ["Orientación presentada", "El copilot indica al agente humano los pasos para verificar el pedido, solicitar la devolución y enviar los datos."],
        "wrap-up": ["Agente listo para responder", "La respuesta sugerida y su fuente permanecen visibles. El agente humano decide cómo continuar. No se realiza ninguna devolución ni cambio en la cuenta."],
      },
    },
    "voice-qa": {
      description: "Revise una conversación de voz de muestra y explore aspectos destacados ilustrativos sobre retención, problemas de producto y servicio excepcional.",
      stages: {
        conversation: ["Conversación de muestra", "Un cliente pide devolver una bolsa de café; el agente confirma el pedido 15023."],
        review: ["Conversación revisada", "Una revisión de calidad ilustrada examina la conversación de muestra. No se carga ni se analiza ninguna grabación."],
        risk: ["Posible riesgo de abandono", "Un aspecto destacado de muestra indica un posible seguimiento de retención, no una evaluación real."],
        product: ["Posible problema de producto", "Una señal ilustrativa identifica un seguimiento relacionado con el producto para su revisión."],
        service: ["Servicio excepcional", "El último ejemplo destaca la rápida confirmación del pedido por parte del agente. Las funciones de calidad requieren el producto y la configuración correspondientes."],
      },
    },
    "voice-ai-agents": {
      description: "Siga una conversación de reemplazo de muestra: un agente de voz de IA confirma la solicitud e ilustra una resolución coordinada.",
      stages: {
        request: ["Solicitud comprendida", "Un cliente pide reemplazar un artículo dañado."],
        confirmation: ["Confirmación del cliente", "El cliente acepta un reemplazo y la recogida del artículo original."],
        replacement: ["Reemplazo simulado", "Una acción preparada ilustra la creación de un reemplazo. No se modifica ningún pedido."],
        pickup: ["Recogida simulada", "Una segunda acción simulada ilustra la programación de una recogida por el transportista."],
        notification: ["Confirmación simulada", "Una última acción simulada ilustra el envío de los detalles. No se crea ningún reemplazo ni recogida, ni se envía ninguna notificación."],
      },
    },
    "video-screen-sharing": {
      description: "Pase de una conversación de mensajería de muestra a una videollamada, compruebe audio y cámara y guíe al cliente con una ventana de configuración compartida sin perder el contexto del ticket.",
      stages: {
        invitation: ["Invitar desde el ticket", "En esta simulación, el agente humano envía una invitación de vídeo en la conversación de mensajería existente."],
        preview: ["Vista previa antes de entrar", "Ambos participantes pueden comprobar el audio y el vídeo antes de unirse a la llamada desde el navegador."],
        connected: ["Conectar por vídeo", "El cliente y el agente se reúnen por vídeo mientras el contexto del ticket permanece visible."],
        "select-screen": ["Elegir una ventana", "Seleccione una ventana de configuración preparada. Comparta solo lo necesario y oculte los datos privados. No se captura ninguna pantalla real."],
        sharing: ["Guiar con contexto visual", "La ventana seleccionada y los vídeos de los participantes permanecen visibles a la vez."],
        resolution: ["Resolver en contexto", "El dispositivo de muestra queda conectado y la conversación permanece en el mismo ticket."],
      },
    },
  },
  "fr-FR": {
    "voice-copilot": {
      description: "Suivez un exemple d'appel de retour : l'agent consulte le contexte client, l'intention de la conversation et les conseils issus de la base de connaissances.",
      stages: {
        connected: ["Appel connecté", "Terry demande de l'aide pour retourner une commande. L'agent voit le contexte client et celui de l'appel."],
        intent: ["Intention reconnue", "Un exemple de transcription présente une demande de retour et un sentiment neutre."],
        knowledge: ["Article présenté", "Un article illustratif sur les retours et remboursements s'affiche à côté de la conversation. La disponibilité dépend de la configuration."],
        guidance: ["Conseils présentés", "Le copilot indique à l'agent humain les étapes de vérification de la commande, de demande de retour et d'envoi des informations."],
        "wrap-up": ["Agent prêt à répondre", "La réponse suggérée et sa source restent visibles. L'agent humain décide de la suite. Aucun retour ni aucune modification de compte n'est effectué."],
      },
    },
    "voice-qa": {
      description: "Examinez un exemple de conversation vocale et des mises en avant illustratives sur la fidélisation, les problèmes produit et le service exceptionnel.",
      stages: {
        conversation: ["Exemple de conversation", "Un client demande à retourner un sachet de café ; l'agent confirme la commande 15023."],
        review: ["Conversation examinée", "Un contrôle qualité illustré examine l'exemple de conversation. Aucun enregistrement n'est importé ni analysé."],
        risk: ["Risque de départ éventuel", "Un exemple met en avant un éventuel suivi de fidélisation, et non une évaluation réelle."],
        product: ["Problème produit éventuel", "Un signal illustratif indique un suivi lié au produit à examiner."],
        service: ["Service exceptionnel", "Le dernier exemple souligne la confirmation rapide de la commande par l'agent. Les fonctionnalités de qualité nécessitent le produit et la configuration correspondants."],
      },
    },
    "voice-ai-agents": {
      description: "Suivez un exemple de conversation de remplacement : un agent vocal IA confirme la demande et illustre une résolution coordonnée.",
      stages: {
        request: ["Demande comprise", "Un client demande le remplacement d'un article endommagé."],
        confirmation: ["Confirmation du client", "Le client accepte un remplacement et la collecte de l'article d'origine."],
        replacement: ["Remplacement simulé", "Une action préparée illustre la création d'un remplacement. Aucune commande n'est modifiée."],
        pickup: ["Collecte simulée", "Une deuxième action simulée illustre la planification d'une collecte par le transporteur."],
        notification: ["Confirmation simulée", "Une dernière action simulée illustre l'envoi des informations. Aucun remplacement ni aucune collecte n'est créé, et aucune notification n'est envoyée."],
      },
    },
    "video-screen-sharing": {
      description: "Passez d'un exemple de messagerie à la vidéo, vérifiez le son et la caméra, puis guidez le client dans une fenêtre de configuration partagée sans perdre le contexte du ticket.",
      stages: {
        invitation: ["Inviter depuis le ticket", "Dans cette simulation, l'agent humain envoie une invitation vidéo dans la conversation de messagerie existante."],
        preview: ["Aperçu avant de rejoindre", "Les deux participants peuvent vérifier le son et la vidéo avant de rejoindre l'appel dans le navigateur."],
        connected: ["Se retrouver en vidéo", "Le client et l'agent se retrouvent en vidéo tandis que le contexte du ticket reste visible."],
        "select-screen": ["Choisir une fenêtre", "Sélectionnez une fenêtre de configuration préparée. Ne partagez que le nécessaire et masquez les informations privées. Aucune capture d'écran réelle n'a lieu."],
        sharing: ["Guider avec le contexte visuel", "La fenêtre sélectionnée et les vidéos des participants restent visibles ensemble."],
        resolution: ["Résoudre dans le contexte", "L'appareil de démonstration est connecté et la conversation reste dans le même ticket."],
      },
    },
  },
} satisfies Record<Exclude<DemoScriptLocale, "en-US">, LocalizedNuggets>;

function translateNuggets(locale: Exclude<DemoScriptLocale, "en-US">): readonly DemoNugget[] {
  const copy: LocalizedNuggets = DEMO_SCENE_TRANSLATIONS[locale];
  return DEMO_NUGGETS.map((nugget) => {
    const translated = copy[nugget.id];
    // The mapped type above checks every ID; widen only for this union traversal.
    const stages: Record<string, readonly [string, string]> = translated.stages;
    return { ...nugget, description: translated.description, stages: nugget.stages.map(stage => ({
      ...stage, label: stages[stage.id][0], description: stages[stage.id][1],
    })) };
  });
}

// Stable objects: changing unrelated controls must not recreate playback clocks.
const LOCALIZED_NUGGETS: Record<DemoScriptLocale, readonly DemoNugget[]> = {
  "en-US": DEMO_NUGGETS, "es-ES": translateNuggets("es-ES"), "fr-FR": translateNuggets("fr-FR"),
};
export function getDemoNuggets(locale: DemoScriptLocale): readonly DemoNugget[] {
  return LOCALIZED_NUGGETS[locale];
}
