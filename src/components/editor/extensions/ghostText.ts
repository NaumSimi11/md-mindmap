export const getMockAISuggestion = async (context: string): Promise<string | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const text = context.trim();
    const words = text.split(/\s+/);
    const lastWord = words[words.length - 1]?.toLowerCase() || '';

    // Natural continuations based on last word
    const continuations: Record<string, string[]> = {
        'the': ['best way to', 'main goal is', 'important thing is', 'key point is'],
        'a': ['great opportunity', 'better approach', 'simple solution', 'good idea'],
        'to': ['make this work', 'ensure success', 'achieve our goals', 'improve quality'],
        'is': ['working well', 'very important', 'quite interesting', 'really useful'],
        'will': ['help us', 'make it better', 'improve things', 'work perfectly'],
        'can': ['do this by', 'make it work', 'improve this', 'achieve that'],
        'should': ['focus on', 'work on', 'consider this', 'try this'],
        'would': ['be great', 'work well', 'make sense', 'help us'],
        'and': ['then we can', 'also make', 'improve the', 'create a'],
        'this': ['will help', 'makes sense', 'is important', 'works well'],
        'it': ['will work', 'makes sense', 'looks good', 'works well'],
    };

    // Check if last word has a continuation
    if (continuations[lastWord]) {
        const options = continuations[lastWord];
        return options[Math.floor(Math.random() * options.length)];
    }

    // Generic useful continuations
    const generic = [
        'and make it better',
        'to improve the quality',
        'which will help us',
        'that makes sense here',
        'and ensure it works',
        'to achieve the goal',
    ];

    return generic[Math.floor(Math.random() * generic.length)];
};
