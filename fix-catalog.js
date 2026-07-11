const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== MEMPERBARUI SEMUA KATALOG AI ===');

  // 1. Groq
  await p.aiCatalog.updateMany({
    where: { providerValue: 'groq' },
    data: {
      models: JSON.stringify([
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'mixtral-8x7b-32768',
        'gemma2-9b-it'
      ])
    }
  });

  // 2. Google Gemini
  await p.aiCatalog.updateMany({
    where: { providerValue: 'google' },
    data: {
      models: JSON.stringify([
        'gemini-2.0-flash',
        'gemini-2.0-pro',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ])
    }
  });

  // 3. Anthropic Claude
  await p.aiCatalog.updateMany({
    where: { providerValue: 'anthropic' },
    data: {
      models: JSON.stringify([
        'claude-3.5-sonnet',
        'claude-3.5-haiku',
        'claude-3-opus-20240229'
      ])
    }
  });

  // 4. OpenAI
  await p.aiCatalog.updateMany({
    where: { providerValue: 'openai' },
    data: {
      models: JSON.stringify([
        'gpt-4o',
        'gpt-4o-mini',
        'o1',
        'o3-mini'
      ])
    }
  });

  console.log('✅ Semua Katalog AI berhasil diperbarui dengan model-model terkini');

  console.log('\n=== MEMPERBARUI MODEL AI YANG USANG ===');
  
  const models = await p.aiModel.findMany();
  for (const m of models) {
    let newName = m.name;
    
    // Update model Anthropic lama ke yang baru
    if (m.name === 'claude-3-haiku-20240307') newName = 'claude-3.5-haiku';
    if (m.name === 'claude-3-sonnet-20240229') newName = 'claude-3.5-sonnet';
    
    // Groq
    if (m.name === 'llama3-8b-8192') newName = 'llama-3.1-8b-instant';
    if (m.name === 'llama3-70b-8192') newName = 'llama-3.3-70b-versatile';

    if (newName !== m.name) {
      await p.aiModel.update({
        where: { id: m.id },
        data: { name: newName }
      });
      console.log(`✅ Model diperbarui: ${m.name} -> ${newName}`);
    }
  }

  await p.$disconnect();
}

main().catch(console.error);
