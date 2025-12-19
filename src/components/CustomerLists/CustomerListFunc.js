import { formatChatTimestamp } from '../../utils/DateFnc';
import { getCustomerAvatarSeed, getCustomerDisplayName, getWhatsAppAvatarConfig } from '../../utils/globalFunc';

export const getMessagePreview = (msg) => {
  switch (msg?.MessageType) {
    case 'text':
      return msg?.Message || '';
    case 'image':
      return '📷 Photo';
    case 'video':
      return '🎥 Video';
    case 'document':
      return '📄 document';
    case 'file':
      return '📄 File';
    default:
      return 'New message';
  }
};

export const processApiResponse = (apiData) => {
  if (!apiData || !Array.isArray(apiData)) return [];

  return apiData.map((conversation) => {
    let lastMessage = conversation.LastMessage;
    if (typeof lastMessage === 'string') {
      try {
        const parsed = JSON.parse(lastMessage);
        if (Array.isArray(parsed) && parsed.length > 0) {
          lastMessage = parsed[0];
        } else if (parsed && typeof parsed === 'object') {
          lastMessage = parsed;
        }
      } catch (e) {
        console.error('Error parsing LastMessage:', e);
      }
    }

    let tags = [];
    if (conversation.TagList) {
      try {
        tags =
          typeof conversation.TagList === 'string'
            ? JSON.parse(conversation.TagList)
            : conversation.TagList;
      } catch (e) {
        console.error('Error parsing TagList:', e);
      }
    }

    return {
      ...conversation,
      ConversationId: conversation.Id,
      lastMessage: conversation.LastMessage ? getMessagePreview(lastMessage) : '',
      lastMessageTime: formatChatTimestamp(lastMessage?.DateTime || conversation.DateTime),
      lastMessageStatus: lastMessage?.Status,
      lastMessageDirection: lastMessage?.Direction,
      unreadCount: conversation.UnReadMsgCount || 0,
      tags: tags,
      name: getCustomerDisplayName(conversation),
      avatar: null,
      avatarConfig: getWhatsAppAvatarConfig(getCustomerAvatarSeed(conversation)),
    };
  });
};

export const getCustomerListMenuItems = (member) => [
  {
    action: member?.IsPin === 1 ? 'UnPin' : 'Pin',
    label: `📌 ${member?.IsPin === 1 ? 'Unpin' : 'Pin'}`,
  },
  {
    action: member?.IsStar === 1 ? 'UnStar' : 'Star',
    label: `⭐ ${member?.IsStar === 1 ? 'Unfavorite' : 'Favorite'}`,
  },
  {
    action: member?.IsArchived === 1 ? 'UnArchive' : 'Archive',
    label: `📂 ${member?.IsArchived === 1 ? 'Unarchive' : 'Archive'}`,
  },
  {
    action: 'AddCustomer',
    label: '👤 Add to Customer',
  },
];