# backend/db/vector_store.py
from pinecone import Pinecone, ServerlessSpec
from openai import OpenAI
import os, uuid

pc     = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
openai = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
INDEX_NAME = os.getenv('PINECONE_INDEX', 'refract-articles')

def init_index():
    if INDEX_NAME not in [i.name for i in pc.list_indexes()]:
        pc.create_index(
            name=INDEX_NAME,
            dimension=1536,    # text-embedding-3-small dimension
            metric='cosine',
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
    return pc.Index(INDEX_NAME)

def embed_text(text: str) -> list[float]:
    resp = openai.embeddings.create(
        model='text-embedding-3-small',
        input=text[:8000]
    )
    return resp.data[0].embedding

def upsert_article(article: dict) -> str:
    index = init_index()
    vec_id = str(uuid.uuid4())
    embedding = embed_text(f"{article['title']} {article['body'][:500]}")
    index.upsert(vectors=[{
        'id': vec_id,
        'values': embedding,
        'metadata': {
            'source_name':  article['source_name'],
            'topic':        article['topic'],
            'title':        article['title'][:200],
            'bias_score':   article.get('bias_score', 0),
            'emotion':      article.get('emotion', ''),
            'published_at': str(article.get('published_at', '')),
        }
    }])
    return vec_id

def semantic_search(query: str, topic_filter: str = None, top_k: int = 10) -> list[dict]:
    index = init_index()
    embedding = embed_text(query)
    filter_dict = {'topic': topic_filter} if topic_filter else {}
    results = index.query(
        vector=embedding, top_k=top_k,
        filter=filter_dict, include_metadata=True
    )
    return [m.metadata for m in results.matches]