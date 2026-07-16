"use client";
import { SubmitEvent, useState } from "react";
import { Button, Form, Input } from "@heroui/react";

type MessageSender = "user" | "chatbot";

interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
}

interface ChatbotResponse {
  chatbotResponse: string;
}

export default function ChatbotPage() {
  const [userInput, setUserInput] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  function displayMessage(sender: MessageSender, text: string): void {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender,
      text,
    };

    setMessages((currentMessages) => [...currentMessages, newMessage]);
  }

  async function getChatbotResponse(userMessage: string): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/getChatbotResponse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userMessage }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as ChatbotResponse;

      if (
        typeof data.chatbotResponse !== "string" ||
        !data.chatbotResponse.trim()
      ) {
        throw new Error("The server returned an invalid chatbot response.");
      }

      displayMessage("chatbot", data.chatbotResponse);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage(): Promise<void> {
    const trimmedMessage = userInput.trim();

    if (!trimmedMessage || isLoading) {
      return;
    }

    displayMessage("user", trimmedMessage);
    setUserInput("");

    await getChatbotResponse(trimmedMessage);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <section className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      <div className="flex flex-1 flex-col items-end overflow-y-auto p-5">
        <div
          aria-live="polite"
          className="h-full w-full overflow-y-auto p-5 [&_p]:my-[10px]"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-3 flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <p
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender === "user"
                    ? "bg-[#2989d8] text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                {message.text}
              </p>
            </div>
          ))}

          {isLoading && (
            <div className="mb-3 flex justify-start">
              <p className="max-w-[80%] rounded-lg bg-gray-200 px-4 py-2 text-gray-900">
                Thinking...
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>

      <Form
        className="flex items-center p-5 gap-2"
        onSubmit={handleSubmit as any}
      >
        <Input
          fullWidth
          aria-label="Chat message"
          placeholder="Ask me anything..."
          type="text"
          value={userInput}
          onChange={(event) => setUserInput(event.target.value)}
        />

        <Button isDisabled={!userInput} isPending={isLoading} type="submit">
          Send
        </Button>
      </Form>
    </section>
  );
}
