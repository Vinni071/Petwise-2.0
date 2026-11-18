#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _MSC_VER
#pragma execution_character_set("utf-8")
#endif

typedef struct {
    char nome[160];
    char contato[160];
    char email[160];
} Cliente;

typedef struct {
    char nome[160];
    char especie[160];
    char raca[160];
    char idade[160];
    char sexo[160];
    char peso[160];
} Animal;

typedef struct {
    char ultima_consulta[160];
    char observacoes[160];
} Atendimento;

static void remover_quebra_linha(char *texto) {
    texto[strcspn(texto, "\r\n")] = '\0';
}

static void ler_campo(const char *rotulo, char *destino, size_t tamanho) {
    do {
        printf("%s: ", rotulo);
        if (fgets(destino, (int)tamanho, stdin) == NULL) {
            fputs("\nEntrada encerrada.\n", stderr);
            exit(EXIT_FAILURE);
        }
        remover_quebra_linha(destino);
        if (destino[0] == '\0') {
            puts("Este campo e obrigatorio. Tente novamente.");
        }
    } while (destino[0] == '\0');
}

static void ler_campo_opcional(const char *rotulo, char *destino, size_t tamanho) {
    printf("%s (opcional): ", rotulo);
    if (fgets(destino, (int)tamanho, stdin) == NULL) {
        fputs("\nEntrada encerrada.\n", stderr);
        exit(EXIT_FAILURE);
    }
    remover_quebra_linha(destino);
    if (destino[0] == '\0') {
        strcpy(destino, "Nao informado");
    }
}

static void escrever_string_json(FILE *arquivo, const char *texto) {
    const unsigned char *caractere = (const unsigned char *)texto;

    fputc('"', arquivo);
    while (*caractere != '\0') {
        switch (*caractere) {
            case '"':
                fputs("\\\"", arquivo);
                break;
            case '\\':
                fputs("\\\\", arquivo);
                break;
            case '\b':
                fputs("\\b", arquivo);
                break;
            case '\f':
                fputs("\\f", arquivo);
                break;
            case '\n':
                fputs("\\n", arquivo);
                break;
            case '\r':
                fputs("\\r", arquivo);
                break;
            case '\t':
                fputs("\\t", arquivo);
                break;
            default:
                if (*caractere < 0x20) {
                    fprintf(arquivo, "\\u%04x", (unsigned int)*caractere);
                } else {
                    fputc(*caractere, arquivo);
                }
                break;
        }
        caractere++;
    }
    fputc('"', arquivo);
}

static void escrever_campo_json(
    FILE *arquivo,
    const char *nome,
    const char *valor,
    int ultimo
) {
    fputs("    ", arquivo);
    escrever_string_json(arquivo, nome);
    fputs(": ", arquivo);
    escrever_string_json(arquivo, valor);
    fputs(ultimo ? "\n" : ",\n", arquivo);
}

static int gravar_ficha(const Cliente *cliente, const Animal *animal,
                        const Atendimento *atendimento) {
    FILE *arquivo = fopen("data/ficha.json", "wb");
    if (arquivo == NULL) {
        perror("Nao foi possivel criar data/ficha.json");
        return 0;
    }

    fputs("{\n  \"Cliente\": {\n", arquivo);
    escrever_campo_json(arquivo, "Nome", cliente->nome, 0);
    escrever_campo_json(arquivo, "Contato", cliente->contato, 0);
    escrever_campo_json(arquivo, "E-mail", cliente->email, 1);
    fputs("  },\n  \"Animal\": {\n", arquivo);
    escrever_campo_json(arquivo, "Nome", animal->nome, 0);
    escrever_campo_json(arquivo, "Especie", animal->especie, 0);
    escrever_campo_json(arquivo, "Raca", animal->raca, 0);
    escrever_campo_json(arquivo, "Idade", animal->idade, 0);
    escrever_campo_json(arquivo, "Sexo", animal->sexo, 0);
    escrever_campo_json(arquivo, "Peso", animal->peso, 1);
    fputs("  },\n  \"Atendimento\": {\n", arquivo);
    escrever_campo_json(arquivo, "Ultima consulta", atendimento->ultima_consulta, 0);
    escrever_campo_json(arquivo, "Observacoes", atendimento->observacoes, 1);
    fputs("  }\n}\n", arquivo);

    if (ferror(arquivo) || fclose(arquivo) != 0) {
        fputs("Erro ao gravar a ficha.\n", stderr);
        return 0;
    }
    return 1;
}

int main(void) {
    Cliente cliente;
    Animal animal;
    Atendimento atendimento;

    puts("=== Cadastro PetWise ===");
    puts("Informe os dados do tutor e do animal.\n");
    puts("-- Dados do tutor --");
    ler_campo("Nome completo", cliente.nome, sizeof(cliente.nome));
    ler_campo("Telefone ou contato", cliente.contato, sizeof(cliente.contato));
    ler_campo("E-mail", cliente.email, sizeof(cliente.email));

    puts("\n-- Dados do animal --");
    ler_campo("Nome do animal", animal.nome, sizeof(animal.nome));
    ler_campo("Especie", animal.especie, sizeof(animal.especie));
    ler_campo("Raca", animal.raca, sizeof(animal.raca));
    ler_campo("Idade", animal.idade, sizeof(animal.idade));
    ler_campo("Sexo", animal.sexo, sizeof(animal.sexo));
    ler_campo("Peso", animal.peso, sizeof(animal.peso));

    puts("\n-- Atendimento (opcional) --");
    ler_campo_opcional("Ultima consulta", atendimento.ultima_consulta,
                       sizeof(atendimento.ultima_consulta));
    ler_campo_opcional("Observacoes", atendimento.observacoes,
                       sizeof(atendimento.observacoes));

    if (!gravar_ficha(&cliente, &animal, &atendimento)) {
        return EXIT_FAILURE;
    }
    puts("\nCadastro realizado com sucesso!");
    puts("A ficha foi salva em data/ficha.json.");
    return EXIT_SUCCESS;
}
