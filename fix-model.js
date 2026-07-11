const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const OR_KEY = 'sk-or-v1-YOUR_OPENROUTER_KEY';

  // ============================================================
  // 1. PERBAIKI KATALOG AI (AiCatalog)
  // ============================================================
  console.log('=== PERBAIKI KATALOG AI ===');

  // Update OpenRouter catalog — hapus model yang sudah mati, tambah yang aktif
  await p.aiCatalog.update({
    where: { id: 'cmrfzic3r0000hfjubpmz9t7u' },
    data: {
      models: JSON.stringify([
        'openrouter/free',
        'google/gemma-3-4b-it:free',
        'meta-llama/llama-4-scout:free',
        'qwen/qwen3-8b:free',
        'mistralai/devstral-small:free',
      ]),
    },
  });
  console.log('✅ Katalog OpenRouter diperbarui dengan model-model yang aktif');

  // ============================================================
  // 2. PERBAIKI MODEL & MESIN AI (AiModel)
  // ============================================================
  console.log('\n=== PERBAIKI MODEL & MESIN AI ===');

  // Model openrouter/free sudah di-update sebelumnya, sekarang bersihkan
  // model-model OpenRouter lain yang pakai nama lama

  // Update meta-llama/llama-3-8b-instruct:free -> meta-llama/llama-4-scout:free
  await p.aiModel.update({
    where: { id: 'cmrfzlzpd00017ro688sc5gcv' },
    data: { name: 'meta-llama/llama-4-scout:free' },
  });
  console.log('✅ Model meta-llama diperbarui: llama-3-8b-instruct:free -> llama-4-scout:free');

  // Update qwen/qwen-2-7b-instruct:free -> qwen/qwen3-8b:free
  await p.aiModel.update({
    where: { id: 'cmrfzm8dd00027ro6zoe4epk4' },
    data: { name: 'qwen/qwen3-8b:free' },
  });
  console.log('✅ Model qwen diperbarui: qwen-2-7b-instruct:free -> qwen3-8b:free');

  // Hapus model dengan DUMMY_KEY (tidak fungsional, membingungkan di UI admin)
  const dummyModels = await p.aiModel.findMany({
    where: { apiKey: { startsWith: 'DUMMY_KEY' } },
  });

  for (const dm of dummyModels) {
    // Cek apakah ada Plan yang terhubung ke model ini
    const linkedPlans = await p.plan.count({ where: { aiModelId: dm.id } });
    if (linkedPlans > 0) {
      console.log(`⚠️  Model ${dm.name} (${dm.provider}) masih terhubung ke ${linkedPlans} plan — TIDAK dihapus`);
    } else {
      await p.aiModel.delete({ where: { id: dm.id } });
      console.log(`🗑️  Model ${dm.name} (${dm.provider}) dengan DUMMY_KEY dihapus`);
    }
  }

  // ============================================================
  // 3. VERIFIKASI PLAN
  // ============================================================
  console.log('\n=== VERIFIKASI PLAN ===');
  const plans = await p.plan.findMany({ include: { aiModel: true } });
  for (const plan of plans) {
    const status = plan.aiModel
      ? (plan.aiModel.apiKey.startsWith('DUMMY') ? '⚠️  DUMMY KEY' : '✅ OK')
      : '❌ TANPA MODEL';
    console.log(`${status} | Plan "${plan.name}" (${plan.type}) -> ${plan.aiModel?.provider}/${plan.aiModel?.name || 'N/A'}`);
  }

  // ============================================================
  // 4. HASIL AKHIR
  // ============================================================
  console.log('\n=== HASIL AKHIR ===');

  console.log('\n--- Katalog AI ---');
  const catalogs = await p.aiCatalog.findMany();
  for (const c of catalogs) {
    console.log(`${c.isActive ? '✅' : '❌'} ${c.providerName} (${c.providerValue}): ${c.models}`);
  }

  console.log('\n--- Model AI ---');
  const models = await p.aiModel.findMany();
  for (const m of models) {
    const keyPreview = m.apiKey.startsWith('DUMMY') ? '⚠️ DUMMY' : `✅ ${m.apiKey.substring(0, 12)}...`;
    console.log(`${m.isActive ? '✅' : '❌'} ${m.provider}/${m.name} | Key: ${keyPreview}`);
  }

  console.log('\n--- Plans ---');
  const finalPlans = await p.plan.findMany({ include: { aiModel: true } });
  for (const pl of finalPlans) {
    console.log(`${pl.isActive ? '✅' : '❌'} ${pl.name} (${pl.type}) -> ${pl.aiModel?.provider}/${pl.aiModel?.name}`);
  }

  await p.$disconnect();
}

main().catch(console.error);
