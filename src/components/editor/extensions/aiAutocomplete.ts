// AI Autocomplete Suggestion Generator (Smarter than inline hints!)
export const getAIAutocompleteSuggestion = async (context: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const text = context.trim().toLowerCase();

    // Smart pattern matching for autocomplete

    // Heading detection
    if (text.endsWith('## ') || text.endsWith('# ')) {
        const headingStarters = [
            'Introduction',
            'Overview',
            'Getting Started',
            'Installation',
            'Configuration',
            'Usage',
            'Examples',
            'API Reference',
            'Troubleshooting',
            'FAQ',
            'Contributing',
            'License',
        ];
        return headingStarters[Math.floor(Math.random() * headingStarters.length)];
    }

    // List item detection
    if (text.endsWith('- ') || text.endsWith('* ')) {
        const listItems = [
            'Easy to set up and configure',
            'Works with all major platforms',
            'Includes comprehensive documentation',
            'Supports multiple file formats',
            'Provides real-time updates',
            'Built with performance in mind',
        ];
        return listItems[Math.floor(Math.random() * listItems.length)];
    }

    // Sentence continuation
    const sentences = text.split(/[.!?]\s+/);
    const lastSentence = sentences[sentences.length - 1] || '';
    const words = lastSentence.split(/\s+/);
    const lastWords = words.slice(-3).join(' ').toLowerCase();

    // Context-aware continuations
    if (lastWords.includes('install')) {
        return ' by running npm install in your terminal';
    }
    if (lastWords.includes('configure') || lastWords.includes('config')) {
        return ' the settings in the configuration file';
    }
    if (lastWords.includes('feature') || lastWords.includes('function')) {
        return ' provides a seamless user experience';
    }
    if (lastWords.includes('user') || lastWords.includes('users')) {
        return ' can easily access all functionality';
    }
    if (lastWords.includes('api') || lastWords.includes('endpoint')) {
        return ' endpoint accepts JSON requests and returns structured data';
    }
    if (lastWords.includes('documen') || lastWords.includes('doc')) {
        return ' includes examples and best practices';
    }

    // Generic smart continuations
    const smartContinuations = [
        ' which ensures optimal performance',
        ' and provides excellent developer experience',
        ' to streamline your workflow',
        ' with built-in error handling',
        ' following industry best practices',
        ' that integrates seamlessly',
    ];

    return smartContinuations[Math.floor(Math.random() * smartContinuations.length)];
};
