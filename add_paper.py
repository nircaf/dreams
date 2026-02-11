import json
import os
from datetime import datetime

PAPERS_FILE = 'papers_data.js'
PREFIX = 'window.papersData = '
SUFFIX = ';\n'

def load_papers():
    if not os.path.exists(PAPERS_FILE):
        return []
    try:
        with open(PAPERS_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            # Strip the prefix assignments and suffix
            if content.startswith(PREFIX):
                content = content[len(PREFIX):]
            if content.strip().endswith(';'):
                content = content.strip()[:-1]
            return json.loads(content)
    except json.JSONDecodeError:
        print(f"Error reading {PAPERS_FILE}. Starting with an empty list.")
        return []
    except Exception as e:
        print(f"Error: {e}")
        return []

def save_papers(papers):
    with open(PAPERS_FILE, 'w', encoding='utf-8') as f:
        f.write(PREFIX)
        json.dump(papers, f, indent=4, ensure_ascii=False)
        f.write(SUFFIX)
    print(f"Successfully saved {len(papers)} papers to {PAPERS_FILE}.")

def get_input(prompt, required=True):
    while True:
        value = input(prompt).strip()
        if value or not required:
            return value
        print("This field is required.")

def add_paper():
    print("\n--- Add a New Research Paper ---")
    
    papers = load_papers()
    
    # Generate a simple ID
    new_id = str(len(papers) + 1)
    if papers:
        # Try to find the max ID to avoid collisions if papers were deleted
        try:
            max_id = max(int(p.get('id', 0)) for p in papers)
            new_id = str(max_id + 1)
        except ValueError:
            pass # Fallback to length based ID

    title = get_input("Title: ")
    authors = get_input("Authors: ")
    journal = get_input("Journal: ")
    year = get_input("Year: ")
    abstract = get_input("Abstract: ")
    url = get_input("URL: ")
    
    tags_input = get_input("Tags (comma separated, e.g. Sleep, tVNS): ", required=False)
    tags = [t.strip() for t in tags_input.split(',')] if tags_input else []

    new_paper = {
        "id": new_id,
        "title": title,
        "authors": authors,
        "journal": journal,
        "year": year,
        "abstract": abstract,
        "url": url,
        "tags": tags,
        "date_added": datetime.now().strftime("%Y-%m-%d")
    }

    papers.insert(0, new_paper) # Add to the beginning
    save_papers(papers)
    print("\nPaper added successfully!")

if __name__ == "__main__":
    add_paper()
