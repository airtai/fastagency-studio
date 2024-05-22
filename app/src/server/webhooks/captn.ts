import { type SmartSuggestionsWebHook } from 'wasp/server/api';

export const smartSuggestionsWebHook: SmartSuggestionsWebHook = async (request, response, context) => {
  const smartSuggestions = request.body.smart_suggestions;
  const chatId = Number(request.body.chat_id);
  const updatedChat = await context.entities.Chat.update({
    where: {
      id: chatId,
    },
    data: {
      smartSuggestions: {
        suggestions: smartSuggestions.suggestions,
        type: smartSuggestions.type,
      },
    },
  });
  response.json({
    chatId: chatId,
  });
};
