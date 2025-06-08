/**
 * Extracts the main error message from HTML error content
 * @param errorHtml - HTML string containing the error message
 * @returns The clean error message without HTML tags and "Error:" prefix
 */
export function getErrorMessage(errorHtml: string): string {
    try {
        // Extract content between <pre> tags
        const preTagMatch = errorHtml.match(/<pre>(.*?)<\/pre>/s);
        
        if (preTagMatch && preTagMatch[1]) {
            // Get the content and remove "Error: " prefix if present
            const errorText = preTagMatch[1].trim();
            return errorText.replace(/^Error:\s*/, '');
        }
        
        // If no match found, return the original string
        return errorHtml;
    } catch (error) {
        // In case of any parsing error, return the original string
        return errorHtml;
    }
}