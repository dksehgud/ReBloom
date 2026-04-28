#qwen2 채팅

import argparse
import sys

from llm_client import DEFAULT_HOST, DEFAULT_MODEL, SYSTEM_PROMPT, post_chat, trim_messages


def main():
    parser = argparse.ArgumentParser(description="Re:Bloom local Qwen chat client")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--once", help="Send one message and exit")
    args = parser.parse_args()

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if args.once:
        messages.append({"role": "user", "content": args.once})
        print(post_chat(args.host, args.model, messages))
        return

    print("Re:Bloom local chat. 종료하려면 /bye 입력.")
    while True:
        try:
            user_text = input("\nYou> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return

        if not user_text:
            continue
        if user_text in {"/bye", "/exit", "/quit"}:
            return

        messages.append({"role": "user", "content": user_text})

        try:
            answer = post_chat(args.host, args.model, messages)
        except RuntimeError as exc:
            print(f"Error: {exc}", file=sys.stderr)
            sys.exit(1)

        print(f"\nRe:Bloom> {answer}")
        messages.append({"role": "assistant", "content": answer})

        messages = trim_messages(messages)


if __name__ == "__main__":
    main()
