import { PrismaClient, PlanType } from '@prisma/client'

const prisma = new PrismaClient()

const actions = ['view', 'show', 'create', 'update', 'delete', 'lookup']
const resources = [
  'dashboard',
  'users',
  'roles',
  'permissions',
  'notes',
  'plans',
  'transactions',
  'settings',
  'promocodes',
  'usagerecords'
]

async function main() {
  console.log('Seeding granular permissions...')

  // 1. Ensure Roles Exist
  const roles = [
    { name: 'SuperAdmin', desc: 'Ultimate Access' },
    { name: 'Manager', desc: 'Manager Access' },
    { name: 'User', desc: 'Default User Access' }
  ]

  const roleRecords: any = {}
  for (const r of roles) {
    let record = await prisma.role.findFirst({ where: { name: r.name } })
    if (!record) {
      record = await prisma.role.create({ data: { name: r.name, description: r.desc } })
      console.log(`Created ${r.name} role.`)
    }
    roleRecords[r.name] = record
  }

  const superAdminRole = roleRecords['SuperAdmin']
  const managerRole = roleRecords['Manager']
  const userRole = roleRecords['User']

  let permsCreated = 0
  let linksCreated = 0

  // Definisikan hak akses spesifik untuk Manager dan User
  const managerAllowed = [
    'view:dashboard',
    'view:users', 'show:users', 'update:users',
    'view:transactions', 'show:transactions', 'update:transactions',
    'view:notes', 'show:notes', 'delete:notes',
    'view:plans', 'show:plans',
    'view:promocodes', 'show:promocodes', 'create:promocodes', 'update:promocodes',
    'view:usagerecords', 'show:usagerecords'
  ]
  const userAllowed = [
    'view:dashboard',
    'view:notes', 'show:notes', 'create:notes', 'update:notes', 'delete:notes',
    'view:usagerecords',
    'view:transactions', 'show:transactions',
    'view:plans', 'show:plans'
  ]

  // 2. Generate and ensure permissions
  for (const resource of resources) {
    for (const action of actions) {
      const permKey = `${action}:${resource}`
      
      // Find or create permission
      let perm = await prisma.permission.findFirst({
        where: { action, resource }
      })

      if (!perm) {
        perm = await prisma.permission.create({
          data: { action, resource, description: `Can ${action} ${resource}` }
        })
        permsCreated++
      }

      // Link to SuperAdmin (All access)
      let linkExists = await prisma.rolePermission.findFirst({
        where: { roleId: superAdminRole.id, permissionId: perm.id }
      })
      if (!linkExists) {
        await prisma.rolePermission.create({
          data: { roleId: superAdminRole.id, permissionId: perm.id }
        })
        linksCreated++
      }

      // Link to Manager
      if (managerAllowed.includes(permKey)) {
        linkExists = await prisma.rolePermission.findFirst({
          where: { roleId: managerRole.id, permissionId: perm.id }
        })
        if (!linkExists) {
          await prisma.rolePermission.create({
            data: { roleId: managerRole.id, permissionId: perm.id }
          })
          linksCreated++
        }
      }

      // Link to User
      if (userAllowed.includes(permKey)) {
        linkExists = await prisma.rolePermission.findFirst({
          where: { roleId: userRole.id, permissionId: perm.id }
        })
        if (!linkExists) {
          await prisma.rolePermission.create({
            data: { roleId: userRole.id, permissionId: perm.id }
          })
          linksCreated++
        }
      }
    }
  }

    // --- KODE BUATAN ANDA UNTUK SUPER ADMIN ---

  //   // --- KODE BUATAN ANDA UNTUK SUPER ADMIN ---
  // const emailAdmin = "admin@email.com" // Ganti dengan email Anda
  
  // // Cari user berdasarkan email
  // const existingUser = await prisma.user.findUnique({
  //   where: { email: emailAdmin }
  // })

  // if (existingUser) {
  //   // Jika user sudah ada, naikkan jabatannya
  //   await prisma.user.update({
  //     where: { email: emailAdmin },
  //     data: { roleId: superAdminRole.id }
  //   })
  //   console.log(`Berhasil menaikkan jabatan ${emailAdmin} menjadi SuperAdmin!`)
  // } else {
  //   // Jika belum ada, buat akun baru
  //   const bcrypt = require('bcryptjs')
  //   await prisma.user.create({
  //     data: {
  //       name: "Super Admin",
  //       email: emailAdmin,
  //       password: await bcrypt.hash("password123", 10), // Ganti password Anda
  //       roleId: superAdminRole.id
  //     }
  //   })
  //   console.log(`Berhasil membuat akun SuperAdmin baru: ${emailAdmin}`)
  // }

  // 3. Seed AI Models (Popular and Cheap/Free)
  console.log('Seeding AI Models...')
  const aiModels = [
    { provider: 'groq', name: 'llama3-8b-8192', apiKey: 'DUMMY_KEY_GROQ_LLAMA3' },
    { provider: 'groq', name: 'mixtral-8x7b-32768', apiKey: 'DUMMY_KEY_GROQ_MIXTRAL' },
    { provider: 'google', name: 'gemini-1.5-flash', apiKey: 'DUMMY_KEY_GEMINI_FLASH' },
    { provider: 'anthropic', name: 'claude-3-haiku-20240307', apiKey: 'DUMMY_KEY_CLAUDE_HAIKU' },
    { provider: 'openai', name: 'gpt-4o-mini', apiKey: 'DUMMY_KEY_GPT4O_MINI' },
  ]

  let aiModelsCreated = 0
  for (const model of aiModels) {
    const existing = await prisma.aiModel.findFirst({
      where: { provider: model.provider, name: model.name }
    })
    if (!existing) {
      await prisma.aiModel.create({ data: model })
      aiModelsCreated++
    }
  }

  // 4. Seed AI Catalog (Master Catalog)
  console.log('Seeding AI Catalog...')
  const aiCatalogs = [
    {
      providerName: 'Groq',
      providerValue: 'groq',
      models: JSON.stringify(['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768'])
    },
    {
      providerName: 'Google Gemini',
      providerValue: 'google',
      models: JSON.stringify(['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'])
    },
    {
      providerName: 'Anthropic Claude',
      providerValue: 'anthropic',
      models: JSON.stringify(['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'])
    },
    {
      providerName: 'OpenAI',
      providerValue: 'openai',
      models: JSON.stringify(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'])
    }
  ]

  let aiCatalogsCreated = 0
  for (const catalog of aiCatalogs) {
    const existing = await prisma.aiCatalog.findFirst({
      where: { providerValue: catalog.providerValue }
    })
    if (!existing) {
      await prisma.aiCatalog.create({ data: catalog })
      aiCatalogsCreated++
    }
  }

  // 5. Seed Subscription Plans
  console.log('Seeding Subscription Plans...')
  const freeAi = await prisma.aiModel.findFirst({ where: { name: 'llama3-8b-8192' } })
  const plusAi = await prisma.aiModel.findFirst({ where: { name: 'gpt-4o-mini' } })
  const proAi = await prisma.aiModel.findFirst({ where: { name: 'claude-3-haiku-20240307' } })

  const plans = [
    {
      name: 'Free',
      type: PlanType.Free,
      price: 0,
      interval: 'month',
      features: JSON.stringify(['Akses 1 Model Dasar', 'Limit 50 Request / Bulan', 'Dukungan Standar']),
      limitCount: 50,
      aiModelId: freeAi?.id || null,
      isActive: true
    },
    {
      name: 'Plus',
      type: PlanType.Paid,
      price: 99000,
      interval: 'month',
      features: JSON.stringify(['Akses Model Pintar (GPT-4o Mini)', 'Limit 1.000 Request / Bulan', 'Dukungan Prioritas', 'Tanpa Iklan']),
      limitCount: 1000,
      aiModelId: plusAi?.id || null,
      isActive: true
    },
    {
      name: 'Pro',
      type: PlanType.Paid,
      price: 249000,
      interval: 'month',
      features: JSON.stringify(['Akses Semua Model Cepat (Termasuk Claude)', 'Request Tanpa Batas (Unlimited)', 'Akses Fitur Beta & API', 'Dukungan Eksklusif 24/7']),
      limitCount: 0,
      aiModelId: proAi?.id || null,
      isActive: true
    }
  ]

  let plansCreated = 0
  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({
      where: { name: plan.name }
    })
    if (!existing) {
      await prisma.plan.create({ data: plan })
      plansCreated++
    }
  }

  console.log(`Seeding completed! Created ${permsCreated} permissions, ${linksCreated} role-permission links, ${aiModelsCreated} AI models (keys), ${aiCatalogsCreated} AI Catalogs, and ${plansCreated} Plans.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })