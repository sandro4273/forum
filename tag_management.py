from db_service import create_tag
import nltk
from nltk import pos_tag, word_tokenize
from nltk.corpus import wordnet as wn
from summa import keywords

# Download necessary resources from NLTK if not already downloaded
nltk.download('punkt')  # for word_tokenize: tokenizes text into words
nltk.download('wordnet')  # for WordNet: our lexical database
nltk.download('averaged_perceptron_tagger')  # for pos_tag: part-of-speech tagging


def closest_noun(word):
    """
    Finds the closest noun to the input word based on its definition.

    Args:
      word: The input word (string).

    Returns:
      The closest noun found in the definition (string), or None if no definition
      is found or no nouns are extracted.
    """

    # Get definition of the word
    synsets = wn.synsets(word)

    # Check if any definitions were found
    if not synsets:
        return None

    # Loop through each definition (synset)
    for synset in synsets:
        # Get the definition of a word and tokenize it
        definition = synset.definition().lower()
        definition_tokens = word_tokenize(definition)

        # Find nouns in the definition with part-of-speech tagging
        nouns = [token for token, pos in pos_tag(definition_tokens) if pos[:1] == 'N']

        # If no nouns are found, continue to the next definition
        if not nouns:
            continue

        # Calculate word similarity using WordNet path similarity
        max_similarity = -1
        closest_noun = None
        for noun in nouns:
            noun_synsets = wn.synsets(noun)
            if not noun_synsets:
                continue

            # Calculate path similarity between word and noun
            similarity = wn.path_similarity(synsets[0], noun_synsets[0])
            if similarity is None:
                continue

            # Update closest noun if similarity is higher
            if similarity > max_similarity:
                max_similarity = similarity
                closest_noun = noun

        # Return the closest noun if found
        if closest_noun:
            return closest_noun

    # No closest noun found
    return None


def transform_non_noun_keywords(text):
    """
    Transforms non-noun keywords into the closest noun found in their definition.
    Args:
        text: The input text (string).

    Returns:
        A list of transformed keywords (strings).
    """

    # Extract keywords from text using TextRank
    extracted_keywords = keywords.keywords(text, scores=True)

    # Transform non-noun keywords into the closest noun
    transformed_keywords = []
    for word, score in extracted_keywords:
        pos_tag = nltk.pos_tag([word])[0][1]
        if pos_tag.startswith('N'):  # if word already is a noun, just add it to the list
            transformed_keywords.append(word)
        else:  # if word is not a noun, transform it
            noun = closest_noun(word)
            if noun:
                transformed_keywords.append(noun)

    # Return transformed keywords containing only nouns
    return transformed_keywords


def assign_tags_to_post(post_title, post_content):
    """
    Assigns tags to a post based on its title and content.
    Args:
        post_title: The title of the post (string).
        post_content: The content of the post (string).

    Returns:
        A list of tags (strings). Only contains nouns which are relevant to the post.
    """

    tags = []

    # Extract keywords from post
    keywords = transform_non_noun_keywords(post_title + ": " + post_content)

    # Create tags from keywords. Manipulates the database.
    for keyword in keywords:
        create_tag(keyword)
        tags.append(keyword)

    return tags
