from db_service import create_tag
import yake
import spacy

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

# YAKE keyword extractor
yake_extractor = yake.KeywordExtractor(lan='en', n=1)


def extract_entities(text):
    """
    Extracts named entities from a given text using SpaCy.
    Args:
        text: The text to extract named entities from (string).

    Returns:
        A list of named entities (strings).
    """

    # Process the text with SpaCy
    doc = nlp(text)

    # Extract named entities without numbers
    entities = [entity.lemma_ for entity in doc.ents]

    return entities


def closest_noun(word):
    return word  # TODO: Implement this function


def lemmatize_words(word_list):
    # Join the list of words into a single string
    text = ' '.join(word_list)

    # Process the text with SpaCy
    doc = nlp(text)

    # Extract lemmas of verbs
    lemmas = [token.lemma_ for token in doc]

    return lemmas


def extract_keywords(text):
    """
    Extracts keywords from a given text using the YAKE algorithm.
    Args:
        text: The text to extract keywords from (string).

    Returns:
        A list of keywords (strings).
    """

    # Extract keywords using YAKE algorithm
    keywords = yake_extractor.extract_keywords(text)

    # Nounify keywords (political -> politics, etc.)
    nounified_keywords = [closest_noun(keyword) for keyword, _ in keywords if closest_noun(keyword) is not None]

    # Lemmatize keywords (apples -> apple, etc.)
    lemmatized_keywords = lemmatize_words(nounified_keywords)

    # Extract named entities from the text
    final_keywords = extract_entities(text) + lemmatized_keywords

    return list(set(final_keywords))

def assign_tags_to_post(post_title, post_content):
    """
    Assigns tags to a post based on its title and content.
    Args:
        post_title: The title of the post (string).
        post_content: The content of the post (string).

    Returns:
        A list of tags (strings). Only contains nouns which are relevant to the post.
    """

    # Extract keywords from post
    TEXT = post_title + ": " + post_content
    text_keywords = extract_keywords(TEXT)

    # Create tags from keywords. Manipulates the database.
    tags = []
    for keyword in text_keywords:
        create_tag(keyword)
        tags.append(keyword)

    return tags
