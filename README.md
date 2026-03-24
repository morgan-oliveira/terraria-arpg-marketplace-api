# terraria-arpg-marketplace-api
Uma API para gerenciamento e efetivação de compras de Itens para o tModLoader.

📄 Terraria ARPG Marketplace – Architecture & Motivation
1. Project Motivation

Este projeto surgiu da necessidade de criar um sistema de marketplace para itens de um mod ARPG inspirado em Diablo desenvolvido para Terraria usando tModLoader.

ARPGs possuem economias complexas baseadas em:

raridade de itens
variações de atributos
negociação entre jogadores
sistemas de geração procedural

O objetivo deste projeto é desenvolver um backend escalável e desacoplado que permita:

listar itens disponíveis no marketplace
permitir compra segura de itens
registrar transações
entregar itens adquiridos diretamente dentro do jogo

O sistema também possui uma interface web simples para interação com o marketplace, enquanto o cliente do jogo atua apenas como consumidor da API.

Este projeto tem como foco demonstrar conhecimentos em:

design de sistemas backend
arquitetura modular
controle de concorrência
paginação eficiente
integração entre sistemas
🏗 2. High-Level Architecture

O sistema utiliza uma arquitetura monolítica modular baseada no NestJS, organizada por domínios de negócio.

Essa abordagem foi escolhida por oferecer:

simplicidade operacional
separação clara de responsabilidades
facilidade de manutenção
possibilidade de evolução futura
Principais componentes do sistema:

Backend API

NestJS
responsável pela lógica de negócio
autenticação
marketplace
processamento de ordens

Web Client

interface simples para navegação no marketplace

Game Client (Terraria Mod)

consome a API
recupera itens comprados através do sistema de mailbox
📦 3. Core Modules
Auth Module

Responsável por:

autenticação de usuários
emissão de tokens JWT
controle de acesso às rotas protegidas
Users Module

Gerencia:

dados básicos do usuário
histórico de compras
Items Module

Define os templates de itens disponíveis no jogo.

Um template contém:

nome
tipo
palavras-chave utilizadas pelo mod para construção do item
thumbnail

Esses templates são usados pelo marketplace para gerar listagens.

Marketplace Module

Gerencia:

itens listados
status do item (disponível / vendido)
preço
vendedor

Esse módulo é responsável por disponibilizar os itens para compra.

Orders Module

Este é o módulo mais crítico do sistema.

Responsável por:

processar compras
garantir consistência durante concorrência
gerar registros de compra

O sistema utiliza concorrência otimista para garantir que apenas um usuário consiga comprar um item listado.

Transactions Module

Registra:

comprador
vendedor
preço
timestamp
snapshot do item vendido

Snapshots garantem que o histórico permaneça consistente mesmo se o item original for alterado posteriormente.

Mailbox Module

Permite que o cliente do jogo recupere itens comprados.

Fluxo:

jogador abre mailbox no jogo
o mod faz requisição à API
a API retorna itens não entregues
o mod constrói os itens no inventário do jogador

Esse sistema permite integração simples entre backend e cliente do jogo.

🔄 4. Purchase Flow

Fluxo simplificado de compra:

usuário autenticado solicita compra
backend valida disponibilidade do item
tentativa de atualização atômica do status
criação da order
registro da transaction
item fica disponível no mailbox do jogador

Esse processo garante que dois usuários não possam comprar o mesmo item simultaneamente.

📄 5. Pagination Strategy

A listagem de itens utiliza paginação para evitar retornos de grandes volumes de dados.

Inicialmente será utilizado limit/offset pagination, com possibilidade futura de migração para cursor-based pagination para melhor performance em datasets maiores.

☁️ 6. Deployment

O backend poderá ser hospedado em uma plataforma cloud gratuita para fins de demonstração.

Possíveis opções:

Railway
Render
Fly.io

A API poderá ser disponibilizada com credenciais de teste para facilitar avaliação técnica.

🎯 7. Project Goals

Este projeto busca demonstrar conhecimento em:

arquitetura backend moderna
design modular
integração entre sistemas
controle de concorrência
construção de APIs escaláveis
