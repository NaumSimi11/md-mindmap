/**
 * Document Entity - Core domain model
 * 
 * Pure TypeScript class with no external dependencies.
 * Represents a markdown document in the system.
 */

export class Document {
    constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly content: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly metadata?: DocumentMetadata
    ) {
        this.validate();
    }

    /**
     * Creates a new document with updated content
     * Immutable pattern - returns new instance
     */
    updateContent(newContent: string): Document {
        return new Document(
            this.id,
            this.title,
            newContent,
            this.createdAt,
            new Date(),
            this.metadata
        );
    }

    /**
     * Creates a new document with updated title
     */
    updateTitle(newTitle: string): Document {
        return new Document(
            this.id,
            newTitle,
            this.content,
            this.createdAt,
            new Date(),
            this.metadata
        );
    }

    /**
     * Creates a new document with updated metadata
     */
    updateMetadata(metadata: DocumentMetadata): Document {
        return new Document(
            this.id,
            this.title,
            this.content,
            this.createdAt,
            new Date(),
            metadata
        );
    }

    /**
     * Domain validation rules
     */
    isValid(): boolean {
        return (
            this.id.length > 0 &&
            this.title.length > 0 &&
            this.title.length <= 255 &&
            this.content.length >= 0
        );
    }

    /**
     * Business rule: Document is considered empty if content is blank
     */
    isEmpty(): boolean {
        return this.content.trim().length === 0;
    }

    /**
     * Business rule: Document is stale if not updated in 30 days
     */
    isStale(daysThreshold: number = 30): boolean {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - this.updatedAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > daysThreshold;
    }

    /**
     * Get word count (business metric)
     */
    getWordCount(): number {
        return this.content
            .split(/\s+/)
            .filter(word => word.length > 0).length;
    }

    /**
     * Get character count (business metric)
     */
    getCharacterCount(): number {
        return this.content.length;
    }

    /**
     * Estimate reading time in minutes (business metric)
     * Average reading speed: 200 words per minute
     */
    getReadingTimeMinutes(): number {
        const wordCount = this.getWordCount();
        return Math.ceil(wordCount / 200);
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON(): DocumentDTO {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            metadata: this.metadata,
        };
    }

    /**
     * Create from plain object (deserialization)
     */
    static fromJSON(data: DocumentDTO): Document {
        return new Document(
            data.id,
            data.title,
            data.content,
            new Date(data.createdAt),
            new Date(data.updatedAt),
            data.metadata
        );
    }

    /**
     * Factory method: Create new document
     */
    static create(title: string, content: string = ''): Document {
        return new Document(
            crypto.randomUUID(),
            title,
            content,
            new Date(),
            new Date()
        );
    }

    /**
     * Internal validation
     */
    private validate(): void {
        if (!this.isValid()) {
            throw new Error('Invalid document: title and id are required');
        }
    }
}

/**
 * Document Metadata Value Object
 */
export interface DocumentMetadata {
    tags?: string[];
    category?: string;
    isFavorite?: boolean;
    lastViewedAt?: Date;
    version?: number;
}

/**
 * Data Transfer Object for serialization
 */
export interface DocumentDTO {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    metadata?: DocumentMetadata;
}
