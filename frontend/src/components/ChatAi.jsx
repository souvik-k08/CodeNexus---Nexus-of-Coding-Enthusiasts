
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send, Bot, User } from 'lucide-react';

function ChatAi({ problem }) {
  const [messages, setMessages] = useState([
    { role: 'model', parts: [{ text: "Hi, how can I help you with this problem?" }] },
    { role: 'user', parts: [{ text: "I want help with the approach." }] }
  ]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSubmit = async (data) => {
    const userMessage = { role: 'user', parts: [{ text: data.message }] };
    setMessages(prev => [...prev, userMessage]);
    reset();

    try {
      const response = await axiosClient.post("/ai/chat", {
        messages: [...messages, userMessage],
        title: problem.title,
        description: problem.description,
        testCases: problem.visibleTestCases,
        startCode: problem.startCode
      });

      setMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: response.data.message }]
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: "Error from AI Chatbot." }]
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-xl shadow bg-base-100 max-h-[80vh]">
      <div className="p-4 border-b font-semibold text-lg">🤖 AI Assistant</div>
      
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 bg-base-200">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[75%] flex items-end gap-2">
              {msg.role === "model" && (
                <div className="bg-base-100 p-2 rounded-full border">
                  <Bot size={20} className="text-primary" />
                </div>
              )}
              <div
                className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                {msg.parts[0].text}
              </div>
              {msg.role === "user" && (
                <div className="bg-blue-100 p-2 rounded-full border">
                  <User size={20} className="text-blue-600" />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-4 bg-base-100 border-t"
      >
        <div className="flex items-center gap-2">
          <input
            placeholder="Type your question..."
            className={`input input-bordered w-full ${errors.message ? 'input-error' : ''}`}
            {...register("message", { required: true, minLength: 2 })}
          />
          <button
            type="submit"
            className="btn btn-primary btn-square"
            disabled={errors.message}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatAi;
