# Requirement

帮我把项目重写城go 语言

**AI Understanding:**
我了解了您的项目需求。您希望将这个火币数据抓取项目从JavaScript/Node.js重写为Go语言。
根据我的分析，当前项目是一个基于Node.js的火币加密货币交易所数据抓取工具，具有以下主要功能：
**项目核心功能：**
- WebSocket连接火币API
- 获取历史K线数据
- 实时订阅K线数据
- MySQL数据库存储
- 配置文件管理（INI/YAML）
- 消息压缩解压缩（zlib）
- 错误处理和重连机制
**技术栈现状：**
- Node.js + WebSocket
- MySQL数据库
- INI/YAML配置文件
- zlib压缩
**重写为Go语言需要考虑：**
1. 使用Go的WebSocket库替代Node.js的ws
2. 使用Go的数据库驱动替代mysql2
3. 使用Go的标准库或第三方库处理INI/YAML配置
4. 使用Go的zlib包处理压缩
5. 保持相同的功能逻辑和数据库结构
**澄清问题：**
您希望在Go语言版本中保持完全相同的功能，还是希望在重写过程中进行一些优化或功能调整？
当您确认需求后，请告诉我"start"或"proceed"，我将为您生成详细的Go语言重写实现计划。

Go语言版本中保持完全相同的功能

**AI Understanding:**
基于对现有Node.js项目的完整分析，我现在完全理解了您需要重写的功能。这是一个完整的火币加密货币交易所数据抓取工具，具有以下核心功能：
**项目完整功能分析：**
1. **WebSocket通信** - 连接火币API，支持历史数据获取和实时订阅
2. **数据压缩处理** - 使用zlib处理WebSocket消息的压缩/解压缩
3. **MySQL数据库** - 存储K线数据，支持创建表、插入、更新、删除操作
4. **配置管理** - INI格式的数据库配置和YAML格式的日志配置
5. **错误处理** - 包含重连机制和异常处理
6. **日志系统** - 基于YAML配置的日志记录
7. **心跳机制** - WebSocket ping-pong保持连接
**Go语言重写将保持完全相同的功能，包括：**
- 相同的WebSocket通信逻辑
- 相同的数据库表结构和操作
- 相同的配置文件和格式
- 相同的错误处理和重连机制
- 相同的压缩解压缩功能
- 相同的日志系统
**技术栈转换：**
- Node.js ws → Go gorilla/websocket 或标准库
- mysql2 → Go database/sql + MySQL驱动
- ini/yaml → Go viper 或标准解析库
- zlib → Go compress/zlib
- 保持相同的项目结构和文件组织
**确认需求：**
您希望在Go语言版本中保持与现有Node.js项目完全相同的功能，不进行任何功能调整或优化。
当您确认后，请告诉我"start"或"proceed"，我将为您生成详细的Go语言重写实现计划。

---

## Implementation Notes

- For any unspecified details (combat formulas, game balance, UI layout, tech choices, etc.), make reasonable decisions yourself and document them in the plan. Do NOT ask the user for clarification — proceed with sensible defaults.
- If referenced image files exist in the workspace, treat them as visual style references.

## Standard Deliverables (mandatory for every project)

- **README.md** — must be included at the project root with: project title & description, prerequisites, installation steps, usage examples with code snippets, configuration options, and project structure overview.
- **Git commits** — use conventional commit prefix `feat:` for all commits.
