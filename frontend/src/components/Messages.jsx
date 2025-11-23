import { useState, useEffect } from 'react';
import { messagesAPI } from '../services/api';
import { FiMessageSquare, FiSend, FiInbox, FiMail, FiPlus } from 'react-icons/fi';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('inbox');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    recipient: '',
    subject: '',
    content: ''
  });
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchMessages();
  }, [activeTab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      let response;
      if (activeTab === 'inbox') {
        response = await messagesAPI.getInbox();
      } else if (activeTab === 'sent') {
        response = await messagesAPI.getSent();
      } else {
        response = await messagesAPI.getAll();
      }
      setMessages(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await messagesAPI.create(formData);
      setShowModal(false);
      setFormData({ recipient: '', subject: '', content: '' });
      fetchMessages();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await messagesAPI.markAsRead(messageId);
      fetchMessages();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

  const unreadCount = messages.filter(m => !m.isRead && m.recipient_id === user.id).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Messages</h2>
          <p className="text-gray-600">Communicate with other users</p>
        </div>
        <button
          onClick={() => {
            setFormData({ recipient: '', subject: '', content: '' });
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <FiPlus className="mr-2" size={18} />
          New Message
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inbox'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <FiInbox className="mr-2" size={18} />
              Inbox
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sent'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <FiSend className="mr-2" size={18} />
              Sent
            </div>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <FiMail className="mr-2" size={18} />
              All Messages
            </div>
          </button>
        </nav>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`card hover:shadow-lg transition-shadow cursor-pointer ${
              !message.isRead && message.recipient_id === user.id ? 'bg-blue-50 border-blue-200' : ''
            }`}
            onClick={() => {
              if (!message.isRead && message.recipient_id === user.id) {
                markAsRead(message.id);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FiMessageSquare className="text-primary-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{message.subject}</h3>
                    <p className="text-sm text-gray-600">
                      {activeTab === 'inbox' || activeTab === 'all'
                        ? `From: ${message.sender?.name || 'Unknown'}`
                        : `To: ${message.recipient?.name || 'Unknown'}`}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-2 line-clamp-2">{message.content}</p>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{new Date(message.createdAt).toLocaleString()}</span>
                  {!message.isRead && message.recipient_id === user.id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      New
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="card text-center py-12">
          <FiMessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No messages found</p>
        </div>
      )}

      {/* Send Message Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Send New Message</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To (User ID)
                  </label>
                  <input
                    type="number"
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    className="input"
                    required
                    placeholder="Enter recipient user ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="input"
                    rows="6"
                    required
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button type="submit" className="btn btn-primary flex-1">
                  <FiSend className="mr-2 inline" size={16} />
                  Send Message
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;

