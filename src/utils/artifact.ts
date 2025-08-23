export function AIWritePrompt(content: string, prompt: string, systemInstruction: string = "") {
  return `Your task is to modify the following artifacts as required in feature.
Try not to change the meaning or story behind the artifact as much as possible.

here is the feature list:
<feature>
${prompt}
</feature>

Here is the current content of the artifact:
<artifact>
${content}
</artifact>

When the following systemInstruction is not empty, you can also think further about artifacts in conjunction with systemInstruction.
<systemInstruction>
${systemInstruction}
</systemInstruction>

Rules and guidelines:
<rules-guidelines>
- ONLY change the language and nothing else.
- Respond with ONLY the updated artifact, and no additional text before or after.
- Do not wrap it in \`<feature></feature>\`, \`<artifact></artifact>\`, \`<systemInstruction></systemInstruction>\`, \`<rules-guidelines></rules-guidelines>\`. Ensure it's just the updated artifact.
- Do not change the language of the updated artifact. The updated artifact language is consistent with the current artifact.
</rules-guidelines>`;
}

export function changeLanguagePrompt(
  content: string,
  lang: string,
  systemInstruction: string = ""
) {
  return `You are a professional ${lang} translator, editor, spelling corrector and improver with rich experience.
You can understand any language, and when I talk to you in any language, you will detect the language of that language, translate it correctly, and reply with the corrected and improved version of the ${lang} text.

Here is the current content of the artifact:
<artifact>
${content}
</artifact>

When the following systemInstruction is not empty, you can also think further about artifacts in conjunction with systemInstruction.
<systemInstruction>
${systemInstruction}
</systemInstruction>

Rules and guidelines:
<rules-guidelines>
- ONLY change the language and nothing else.
- Respond with ONLY the updated artifact, and no additional text before or after.
- Do not wrap it in \`<artifact></artifact>\`, \`<systemInstruction></systemInstruction>\`, \`<rules-guidelines></rules-guidelines>\`. Ensure it's just the updated artifact.
</rules-guidelines>`;
}

export function changeReadingLevelPrompt(
  content: string,
  level: string,
  systemInstruction: string = ""
) {
  let prompt = "";
  if (level === "pirate") {
    prompt = `You are tasked with re-writing the following artifact to sound like a pirate.
Ensure you do not change the meaning or story behind the artifact, simply update the tone to sound like a pirate.    
`;
  } else {
    prompt = `You are tasked with re-writing the following artifact to be at a ${level} reading level.
Ensure you do not change the meaning or story behind the artifact, simply update the tone to be of the appropriate reading level for a ${level} audience.`;
  }
  return `${prompt}
Keep the language of the artifact unchanged. For example, if the original text is in Chinese, the rewritten content must also be in Chinese.

Here is the current content of the artifact:
<artifact>
${content}
</artifact>

When the following systemInstruction is not empty, you can also think further about artifacts in conjunction with systemInstruction.
<systemInstruction>
${systemInstruction}
</systemInstruction>

Rules and guidelines:
<rules-guidelines>
- Respond with ONLY the updated artifact, and no additional text before or after.
- Do not wrap it in \`<artifact></artifact>\`, \`<systemInstruction></systemInstruction>\`, \`<rules-guidelines></rules-guidelines>\`. Ensure it's just the updated artifact.
- Do not change the language of the updated artifact. The updated artifact language is consistent with the current artifact.
</rules-guidelines>`;
}

export function adjustLengthPrompt(
  content: string,
  length: string,
  systemInstruction: string = ""
) {
  return `You are tasked with re-writing the following artifact to be ${length}.
Ensure you do not change the meaning or story behind the artifact, simply update the artifacts length to be ${length}.

Here is the current content of the artifact:
<artifact>
${content}
</artifact>

When the following systemInstruction is not empty, you can also think further about artifacts in conjunction with systemInstruction.
<systemInstruction>
${systemInstruction}
</systemInstruction>

Rules and guidelines:
</rules-guidelines>
- Respond with ONLY the updated artifact, and no additional text before or after.
- Do not wrap it in \`<artifact></artifact>\`, \`<systemInstruction></systemInstruction>\`, \`<rules-guidelines></rules-guidelines>\`. Ensure it's just the updated artifact.
- Do not change the language of the updated artifact. The updated artifact language is consistent with the current artifact.
</rules-guidelines>`;
}

export function addEmojisPrompt(content: string, systemInstruction: string = "") {
  return `You are tasked with revising the following artifact by adding emojis to it.
Ensure you do not change the meaning or story behind the artifact, simply include emojis throughout the text where appropriate.

Here is the current content of the artifact:
<artifact>
${content}
</artifact>

When the following systemInstruction is not empty, you can also think further about artifacts in conjunction with systemInstruction.
<systemInstruction>
${systemInstruction}
</systemInstruction>

Rules and guidelines:
</rules-guidelines>
- Respond with ONLY the updated artifact, and no additional text before or after.
- Ensure you respond with the entire updated artifact, including the emojis.
- Do not wrap it in \`<artifact></artifact>\`, \`<systemInstruction></systemInstruction>\`, \`<rules-guidelines></rules-guidelines>\`. Ensure it's just the updated artifact.
- Do not change the language of the updated artifact. The updated artifact language is consistent with the current artifact.
</rules-guidelines>`;
}

export function continuationPrompt(content: string, systemInstruction: string = "") {
  return `Your task is to continue writing the following artifact.
Maintain the following artifact writing style, including but not limited to typesetting, punctuation, etc.
Only the continued artifact needs to be returned, without including the current artifact.

Here is the current content of the artifact:
<artifact>
${content}
</artifact>

When the following systemInstruction is not empty, you can also think further about artifacts in conjunction with systemInstruction.
<systemInstruction>
${systemInstruction}
</systemInstruction>

Rules and guidelines:
</rules-guidelines>
- Respond with ONLY the continued artifact, and no additional text before.
- Do not wrap it in \`<artifact></artifact>\`, \`<systemInstruction></systemInstruction>\`, \`<rules-guidelines></rules-guidelines>\`. Ensure it's just the updated artifact.
- Do not change the language of the continued artifact. The continued artifact language is consistent with the current artifact.
</rules-guidelines>`;
}
