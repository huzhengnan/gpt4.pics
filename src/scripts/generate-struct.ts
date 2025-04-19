import { promises as fs } from 'fs';
import path from 'path';

async function generateStructure(dir: string, indent: string = '', ignore: Set<string> = new Set()): Promise<string> {
  let result = '';
  const files = await fs.readdir(dir, { withFileTypes: true });
  
  for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
    if (ignore.has(file.name)) continue;
    
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      result += `${indent}├── ${file.name}/               # ${getDirectoryDescription(file.name)}\n`;
      result += await generateStructure(fullPath, indent + '│   ', ignore);
    } else {
      result += `${indent}├── ${file.name}${getFileDescription(file.name)}\n`;
    }
  }
  
  return result;
}

function getDirectoryDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'src': '源代码目录',
    'public': '静态资源目录',
    'components': '组件目录',
    'lib': '库和工具函数目录',
    'api': 'API 路由目录',
    'types': '类型定义目录',
    'app': 'Next.js App Router 目录',
    'auth': '认证相关目录',
    'contexts': 'React Context 目录',
    'db': '数据库相关代码',
    'middleware': '中间件目录',
    'scripts': '脚本工具目录',
    'struct': '项目结构文档',
    'migrations': '数据库迁移文件',
    'repositories': '数据库仓库模式',
    'services': '服务层目录',
    'third-party': '第三方服务集成',
    'login': '登录相关',
    'register': '注册相关',
    'logout': '登出相关',
    'me': '用户信息相关',
    'generate-image': '图像生成相关',
    'prisma': 'Prisma ORM 目录'
  };
  return descriptions[name] || '';
}

function getFileDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'package.json': '          # 项目依赖和脚本',
    'tsconfig.json': '         # TypeScript 配置',
    'next.config.js': '        # Next.js 配置',
    'next.config.ts': '        # TypeScript 版 Next.js 配置',
    'tailwind.config.js': '    # Tailwind CSS 配置',
    'postcss.config.mjs': '    # PostCSS 配置',
    'eslint.config.mjs': '     # ESLint 配置',
    '.env': '                  # 环境变量文件',
    '.env.local': '            # 本地环境变量',
    '.env.prod': '             # 生产环境变量',
    '.gitignore': '            # Git 忽略文件配置',
    'README.md': '             # 项目说明文档',
    'schema.prisma': '         # Prisma 数据库模型定义',
    'migration.sql': '         # 数据库迁移 SQL',
    'migration_lock.toml': '   # Prisma 迁移锁定文件',
    'next-env.d.ts': '         # Next.js 类型声明文件',
    'page.tsx': '              # 页面组件',
    'layout.tsx': '            # 布局组件',
    'route.ts': '              # API 路由处理',
    'globals.css': '           # 全局样式文件',
    'ImageGenerator.tsx': '    # 图像生成组件',
    'AuthContext.tsx': '       # 认证上下文组件',
    'schema.sql': '            # 数据库架构定义',
    'auth.ts': '               # 认证中间件',
    'generate-struct.ts': '    # 项目结构生成脚本',
    'next-step.txt': '         # 项目任务清单',
    'struct-detail.txt': '     # 项目详细结构说明',
    'struct.txt': '            # 项目结构概览',
    'image.ts': '              # 图像相关类型定义',
    'index.ts': '              # 模块导出文件',
    'userRepository.ts': '     # 用户数据仓库',
    'creditAccountRepository.ts': '  # 积分账户仓库',
    'creditTransactionRepository.ts': '# 积分交易仓库',
    'imageGenerationRepository.ts': ' # 图像生成记录仓库',
    'paymentOrderRepository.ts': '    # 支付订单仓库',
    'pricingPlanRepository.ts': '     # 价格方案仓库',
    'couponRepository.ts': '          # 优惠券仓库',
    'couponUsageRepository.ts': '     # 优惠券使用记录仓库',
    'authCookieService.ts': '         # 认证Cookie服务',
    'imageGenerationService.ts': '    # 图像生成服务',
    'paymentService.ts': '            # 支付服务',
    'pricingService.ts': '            # 价格服务',
    'profileService.ts': '            # 用户资料服务',
    'userService.ts': '               # 用户服务',
    'apiyiService.ts': '              # Apiyi API服务',
    'couponService.ts': '             # 优惠券服务'
  };
  return descriptions[name] || '';
}

async function main() {
  const ignoreDirs = new Set([
    'node_modules',
    '.git',
    '.next',
    'coverage',
    '.turbo',
    'dist'
  ]);

  const structure = await generateStructure(process.cwd(), '', ignoreDirs);
  const formattedStructure = `# AI 图像生成网站项目结构\n\n## 目录结构\n\n${structure}`;
  
  const structPath = path.join(process.cwd(), 'src', 'struct', 'struct.txt');
  await fs.writeFile(structPath, formattedStructure, 'utf-8');
  console.log('Structure file generated successfully!');
}

main().catch(console.error);