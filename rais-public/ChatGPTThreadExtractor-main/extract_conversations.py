#!/usr/bin/env python3
"""
Extract ChatGPT conversations from conversations.json into individual text files.
Each file is named: create_date__update_date_title.txt
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path


def sanitize_filename(filename):
    """Remove or replace invalid filename characters."""
    # Replace invalid characters with underscore
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove control characters
    filename = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', filename)
    # Limit length (Windows max path component is 255)
    if len(filename) > 200:
        filename = filename[:200]
    return filename.strip()


def timestamp_to_date(timestamp):
    """Convert Unix timestamp to YYYY-MM-DD format."""
    try:
        return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')
    except:
        return 'unknown'


def traverse_messages(mapping, node_id, visited=None):
    """
    Traverse the message tree in depth-first order to extract messages.
    Returns a list of message dictionaries.
    """
    if visited is None:
        visited = set()

    if node_id in visited or node_id not in mapping:
        return []

    visited.add(node_id)
    node = mapping[node_id]
    messages = []

    # Add current message if it exists and has content
    if node.get('message'):
        msg = node['message']
        author_role = msg.get('author', {}).get('role', 'unknown')
        content = msg.get('content', {})

        # Extract text from content parts
        if content.get('content_type') in ['text', 'code']:
            parts = content.get('parts', [])
            if parts and any(part for part in parts if part):  # Has non-empty content
                text = '\n'.join(str(part) for part in parts if part)
                if text.strip():
                    messages.append({
                        'role': author_role,
                        'text': text,
                        'create_time': msg.get('create_time')
                    })

    # Traverse children in order
    children = node.get('children', [])
    for child_id in children:
        messages.extend(traverse_messages(mapping, child_id, visited))

    return messages


def format_conversation(conversation):
    """
    Format a conversation object into a text file content.
    Returns the formatted string.
    """
    title = conversation.get('title', 'Untitled')
    create_time = conversation.get('create_time')
    update_time = conversation.get('update_time')
    mapping = conversation.get('mapping', {})

    # Format header
    output = []
    output.append(f"Title: {title}")
    output.append(f"Created: {datetime.fromtimestamp(create_time).strftime('%Y-%m-%d %H:%M:%S') if create_time else 'Unknown'}")
    output.append(f"Updated: {datetime.fromtimestamp(update_time).strftime('%Y-%m-%d %H:%M:%S') if update_time else 'Unknown'}")
    output.append("=" * 80)
    output.append("")

    # Find root node(s) - typically "client-created-root" or nodes with null parent
    root_nodes = [nid for nid, node in mapping.items() if node.get('parent') is None]

    # Extract all messages
    all_messages = []
    for root_id in root_nodes:
        all_messages.extend(traverse_messages(mapping, root_id))

    # Format messages
    for msg in all_messages:
        role = msg['role'].upper()
        text = msg['text']

        # Skip system messages that are empty or metadata-only
        if role == 'SYSTEM' and not text.strip():
            continue

        output.append(f"[{role}]")
        output.append(text)
        output.append("")
        output.append("-" * 80)
        output.append("")

    return '\n'.join(output)


def extract_conversations(json_file, output_dir='conversations_output'):
    """
    Extract all conversations from the JSON file into separate text files.
    """
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    print(f"Reading {json_file}...")
    print("This may take a while for large files...")

    # Read and parse JSON
    with open(json_file, 'r', encoding='utf-8') as f:
        conversations = json.load(f)

    print(f"Found {len(conversations)} conversations")
    print(f"Extracting to {output_dir}/")

    # Process each conversation
    for idx, conversation in enumerate(conversations, 1):
        title = conversation.get('title', 'Untitled')
        create_time = conversation.get('create_time')
        update_time = conversation.get('update_time')

        # Format filename: create_date__update_date_title.txt
        create_date = timestamp_to_date(create_time)
        update_date = timestamp_to_date(update_time)
        safe_title = sanitize_filename(title)

        filename = f"{create_date}__{update_date}_{safe_title}.txt"
        filepath = output_path / filename

        # Format and save conversation
        try:
            content = format_conversation(conversation)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

            if idx % 100 == 0:
                print(f"  Processed {idx}/{len(conversations)} conversations...")
        except Exception as e:
            print(f"  Error processing conversation '{title}': {e}")
            continue

    print(f"\nCompleted! Extracted {len(conversations)} conversations to {output_dir}/")


if __name__ == '__main__':
    extract_conversations('conversations.json')
