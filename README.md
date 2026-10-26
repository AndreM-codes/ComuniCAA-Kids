<div align="center">

# 📣 ComuniCAA Kids

Prancha simples de Comunicação Aumentativa e Alternativa (CAA) para crianças não verbais. Cada botão mostra um símbolo e uma palavra. Ao tocar em um botão, o navegador tenta pronunciar a palavra em português.
</div>
<imag src="assets/screenshot_V4mobile.png" alt="screenshot">
</div>

## Como usar

Abra a prancha pelo endereço publicado na web em um navegador moderno e toque em uma imagem para ouvir a palavra.

> [!TIP]
> Destrave e ative os controles de edição tocando no canto superior direito no [🔒].

## O que você encontra aqui

| **Recurso** | **Para quê** | **Resultado** |
| --- | --- | --- |
| `Service Worker`| Instale a prancha ao dispositivo celular | Abrir em uma janela própria e, após o primeiro acesso, também offline |
| `URL Params`| Compartilhe a configuração atual por meio do link | Outra pessoa abre a prancha com as mesmas palavras, símbolos e ordem |

## Tecnologias

- HTML
- CSS
- JavaScript
- Web Speech API para síntese de fala
- Manifesto e Service Worker para instalação e cache da aplicação web

## Estrutura

```text
ComuniCAA-Kids-main/
├── assets/                # Ícones e imagens
├── src/
│   ├── app.js             # Palavras, edição, compartilhamento e voz
│   └── style.css          # Estilos da interface
├── index.html             # Página da prancha
├── manifest.webmanifest   # Metadados para instalação como aplicativo
├── service-worker.js      # Cache para acesso offline
└── README.md              # Documentação do projeto
```
> [!NOTE]
> A voz depende da síntese de fala disponível no navegador e no dispositivo.

> [!IMPORTANT]
> Abrir o arquivo `index.html` diretamente no computador não habilita todos os recursos de instalação e funcionamento offline. Para esses recursos, use o endereço HTTPS publicado.
