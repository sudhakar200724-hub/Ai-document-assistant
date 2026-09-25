import uuid
from datetime import datetime
from database.database import get_db
from rag.extractor import DocumentExtractor
from rag.chunker import DocumentChunker
from rag.vector_store import vector_store

SAMPLE_DOCUMENTS = [
    {
        "id": "sample-doc-1",
        "title": "Attention Is All You Need (Transformer Architecture)",
        "filename": "attention_is_all_you_need.txt",
        "file_type": "txt",
        "content": """Title: Attention Is All You Need
Authors: Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin

Abstract:
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs.

1. Introduction
Recurrent neural networks, long short-term memory (LSTM) and gated recurrent (GRU) neural networks in particular, have been firmly established as state of the art approaches in sequence modeling and transduction problems such as language modeling and machine translation. Numerous efforts have since continued to push the boundaries of recurrent language models and encoder-decoder architectures. Recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states h_t, as a function of the previous hidden state h_{t-1} and the input for position t. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples.

2. Model Architecture
Most competitive neural sequence transduction models have an encoder-decoder structure. Here, the encoder maps an input sequence of symbol representations (x_1, ..., x_n) to a sequence of continuous representations z = (z_1, ..., z_n). Given z, the decoder then generates an output sequence (y_1, ..., y_m) of symbols one element at a time. At each step the model is auto-regressive, consuming the previously generated symbols as additional input when generating the next.

The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder.

Encoder: The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network. We employ a residual connection around each of the two sub-layers, followed by layer normalization. That is, the output of each sub-layer is LayerNorm(x + Sublayer(x)). To facilitate these residual connections, all sub-layers in the model, as well as the embedding layers, produce outputs of dimension d_model = 512.

Decoder: The decoder is also composed of a stack of N = 6 identical layers. In addition to the two sub-layers in each encoder layer, the decoder inserts a third sub-layer, which performs multi-head attention over the output of the encoder stack. Similar to the encoder, we employ residual connections around each of the sub-layers, followed by layer normalization. We also modify the self-attention sub-layer in the decoder stack to prevent positions from attending to subsequent positions. This masking ensures that the predictions for position i can depend only on the known outputs at positions less than i.

3. Attention
An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.

Scaled Dot-Product Attention:
We compute the attention function on a set of queries simultaneously, packed together into a matrix Q. The keys and values are also packed into matrices K and V. We compute the matrix of outputs as:
Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V.
We compute the dot products of the query with all keys, divide each by sqrt(d_k), and apply a softmax function to obtain the weights on the values.

Multi-Head Attention:
Instead of performing a single attention function with d_model-dimensional queries, keys and values, we found it beneficial to linearly project the queries, keys and values h times with different, learned linear projections to d_k, d_k and d_v dimensions, respectively. Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. In this work we employ h = 8 parallel attention layers, or heads. For each of these we use d_k = d_v = d_model / h = 64.

4. Results and Conclusion
On the WMT 2014 English-to-German translation task, the big transformer model outperforms the best previously reported models by more than 2.0 BLEU, reaching a state-of-the-art 28.4 BLEU score. Training took 3.5 days on 8 P100 GPUs. In this work, we presented the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention.
"""
    },
    {
        "id": "sample-doc-2",
        "title": "Next-Gen Enterprise AI Strategy (Business & Financial Report)",
        "filename": "enterprise_ai_strategy.txt",
        "file_type": "txt",
        "content": """Executive Report: Next-Gen Enterprise AI Strategy & Capital Allocation
Prepared for: Board of Directors & C-Suite Leadership
Date: Q3 Strategic Review

1. Executive Summary
The rapid proliferation of enterprise-grade foundation models represents both an unprecedented productivity catalyst and an operational risk. This report provides a quantitative roadmap for deploying document intelligence, agentic automation, and domain-adapted retrieval systems across core business units over the next 24 months. Our financial projections anticipate a 310% Return on Investment (ROI) with cumulative cost savings of $14.2M by year two.

2. Key Strategic Pillars
- Intelligent Document Processing (IDP): Automating compliance audits, contract reconciliations, and vendor invoice parsing, reducing review turnaround times from 4.2 days to under 30 minutes.
- Retrieval-Augmented Generation (RAG): Equipping knowledge workers with grounded, hallucination-resistant internal intelligence platforms, boosting productivity by 28%.
- Governance & Security Gateways: Strict role-based access control (RBAC), on-premise vector embeddings, and rigorous guardrails against intellectual property leakage.

3. Financial Metrics & Capital Allocation
- Initial Capital Expenditure (CapEx): $2.4M for specialized infrastructure, model fine-tuning, and system integration.
- Operational Expenditure (OpEx): $850,000 annualized for cloud inference, API throughput, and security maintenance.
- Anticipated Value Realization:
  * Legal & Compliance: $4.8M annualized reduction in external review billables.
  * Supply Chain & Procurement: $6.1M captured through invoice audit dispute recovery and contract reconciliation.
  * Customer Support & Operations: $3.3M operational savings via 65% deflected routine tier-1 queries.

4. Critical Risks & Mitigation Strategies
- Data Drift & Hallucination: Foundation models can hallucinate incorrect facts if prompts lack grounded context. Mitigation: Enforce strict deterministic vector retrieval with page-level citations and confidence score cutoffs.
- Compliance & Sovereign Data Sovereignty: Handling sensitive GDPR and HIPAA documents via public multi-tenant APIs poses regulatory liabilities. Mitigation: Private VPC endpoints with zero data retention policies.
- Organizational Change Resistance: User adoption bottlenecks among senior subject matter experts. Mitigation: Phased rollout accompanied by personalized learning modes (Beginner, Professional, Expert).

5. Conclusions & Immediate Next Steps
The strategic window for capturing first-mover operational efficiencies in document intelligence is rapidly narrowing. The Board is advised to approve Phase 1 funding ($1.2M) immediately to initiate the pilot deployment in Legal and Procurement.
"""
    },
    {
        "id": "sample-doc-3",
        "title": "Genetics & Cellular Biology Exam Guide (Student Study Guide)",
        "filename": "biology_genetics_exam_guide.txt",
        "file_type": "txt",
        "content": """Course: Biology 201 - Principles of Cellular Biology and Molecular Genetics
Exam Revision Guide: Units 1 to 4

Unit 1: The Molecular Basis of Heredity
DNA (Deoxyribonucleic Acid) is the hereditary material in humans and almost all other organisms. The structure of DNA is a double helix composed of two complementary strands running antiparallel to each other (5' to 3' and 3' to 5'). Each nucleotide consists of a nitrogenous base, a deoxyribose sugar, and a phosphate group. The four nitrogenous bases are Adenine (A), Thymine (T), Guanine (G), and Cytosine (C). According to Chargaff's rules, Adenine always pairs with Thymine via two hydrogen bonds, and Guanine pairs with Cytosine via three hydrogen bonds.

Unit 2: DNA Replication
Replication is semi-conservative: each newly synthesized double helix contains one original template strand and one newly formed complementary strand.
Key enzymes involved:
- Helicase: Unwinds the double helix at the replication fork.
- Single-Strand Binding Proteins (SSB): Stabilize the separated strands to prevent re-annealing.
- Topoisomerase (DNA Gyrase): Relieves torsional strain and supercoiling ahead of the replication fork.
- RNA Primase: Synthesizes a short RNA primer required for DNA polymerase initiation.
- DNA Polymerase III: Catalyzes the addition of complementary nucleotides in the 5' to 3' direction.
- Leading Strand: Synthesized continuously toward the replication fork.
- Lagging Strand: Synthesized discontinuously away from the replication fork, forming Okazaki fragments.
- DNA Ligase: Seals phosphodiester nicks between Okazaki fragments to complete the continuous strand.

Unit 3: The Central Dogma (Transcription and Translation)
The Central Dogma describes the two-step flow of genetic information: DNA -> RNA -> Protein.
- Transcription occurs in the nucleus where RNA Polymerase reads the template DNA strand and synthesizes messenger RNA (mRNA).
- Post-transcriptional modification in eukaryotes includes 5' capping, 3' poly-A tail addition, and splicing (intron excision and exon ligation by spliceosomes).
- Translation occurs in the cytoplasm on ribosomes. Transfer RNA (tRNA) molecules carry specific amino acids corresponding to codons (triplets of nucleotides) on the mRNA. Translation terminates when a stop codon (UAA, UAG, UGA) is encountered.

Unit 4: Mendelian Genetics & Inheritance Patterns
Gregor Mendel established the fundamental laws of inheritance through garden pea experiments:
1. Law of Segregation: Each individual possesses two alleles for each gene, which separate during gamete formation so each gamete carries only one allele.
2. Law of Independent Assortment: Alleles of different genes assort independently of one another during gamete formation, provided the genes are on different chromosomes.
3. Dominant vs Recessive: Heterozygous individuals display the dominant phenotype, while recessive traits require homozygous genotypes.
"""
    }
]


def seed_sample_documents_if_empty():
    """Seed high-quality sample documents into SQLite and the Vector Store."""
    chunker = DocumentChunker(target_words=140, overlap_words=30)
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM documents;")
        count = cursor.fetchone()[0]
        if count > 0:
            # Re-index existing documents in vector store
            cursor.execute("SELECT id FROM documents;")
            doc_ids = [row[0] for row in cursor.fetchall()]
            for d_id in doc_ids:
                cursor.execute("SELECT chunk_index, page_number, content, token_count FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC;", (d_id,))
                chunks = [
                    {
                        "chunk_index": row["chunk_index"],
                        "page_number": row["page_number"],
                        "content": row["content"],
                        "token_count": row["token_count"]
                    }
                    for row in cursor.fetchall()
                ]
                vector_store.index_chunks(d_id, chunks)
            return

        # Seed the 3 documents
        for sample in SAMPLE_DOCUMENTS:
            d_id = sample["id"]
            title = sample["title"]
            filename = sample["filename"]
            raw_text = sample["content"]
            clean_text = DocumentExtractor.clean_text(raw_text)
            pages = DocumentExtractor.extract_from_raw_text(clean_text)
            page_count = len(pages)
            now = datetime.utcnow().isoformat()
            
            cursor.execute("""
                INSERT INTO documents (id, title, filename, file_type, file_size, page_count, raw_text, clean_text, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (d_id, title, filename, "txt", len(raw_text.encode('utf-8')), page_count, raw_text, clean_text, now))
            
            # Chunk and insert
            chunks = chunker.chunk_pages(pages, d_id)
            for c in chunks:
                chunk_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO document_chunks (id, document_id, chunk_index, page_number, content, token_count)
                    VALUES (?, ?, ?, ?, ?, ?);
                """, (chunk_id, d_id, c["chunk_index"], c["page_number"], c["content"], c["token_count"]))

            # Index in Vector Store
            vector_store.index_chunks(d_id, chunks)
