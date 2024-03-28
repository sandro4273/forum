from backend.db_service.database import create_tag  # Function to create a tag in the database
import yake  # YAKE keyword extractor
import spacy  # SpaCy Natural Language Processing library

# Load spaCy model
# Download first: python -m spacy download en_core_web_sm
nlp = spacy.load("en_core_web_sm")

# YAKE keyword extractor
# Keywords must not be longer than 2 words and the top 10 keywords are extracted
yake_extractor = yake.KeywordExtractor(lan='en', n=2, top=10)


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
    """
    Lemmatizes a list of words using SpaCy.

    Args:
        word_list: A list of words (strings).

    Returns:
        A list of lemmatized words (strings).
    """

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


def filter_keywords(keywords):
    """
    Filters out irrelevant keywords from a list of keywords.
    Args:
        keywords: A list of keywords (strings).

    Returns:
        A list of filtered keywords (strings).
    """

    # Filter out keywords which contain a number
    keywords = [keyword for keyword in keywords if not any(char.isdigit() for char in keyword)]

    # Filter out keywords with less than two letters
    filtered_keywords = [keyword for keyword in keywords if len([c for c in keyword if c.isalpha()]) >= 2]

    # Filter out stopwords
    filtered_keywords = [keyword for keyword in filtered_keywords if not nlp.vocab[keyword].is_stop]

    return filtered_keywords


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
    text = post_title + ": " + post_content
    text_keywords = filter_keywords(extract_keywords(text))

    # Create tags from keywords
    tags = []
    for keyword in text_keywords:
        create_tag(keyword)  # Adds tag to database (if it doesn't exist already)
        tags.append(keyword)

    return tags
