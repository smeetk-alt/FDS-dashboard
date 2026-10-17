/*
 * Experiment 3: Dynamic Stack (via SLL) + Infix to Postfix
 * HeatSense use case: a "heat index formula evaluator" stack, used to convert
 * an infix heat-index expression (e.g. temperature/humidity formula) to postfix.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

struct StackNode {
    char data;
    struct StackNode *next;
};

struct StackNode *top = NULL;

void createStack(void) {
    top = NULL;
}

int isEmpty(void) {
    return top == NULL;
}

void push(char x) {
    struct StackNode *newNode = (struct StackNode *)malloc(sizeof(struct StackNode));
    newNode->data = x;
    newNode->next = top;
    top = newNode;
}

char pop(void) {
    if (isEmpty()) {
        return '\0';
    }
    struct StackNode *temp = top;
    char val = temp->data;
    top = top->next;
    free(temp);
    return val;
}

char peek(void) {
    if (isEmpty()) {
        return '\0';
    }
    return top->data;
}

int precedence(char op) {
    if (op == '+' || op == '-') return 1;
    if (op == '*' || op == '/') return 2;
    return 0;
}

void infixToPostfix(const char *infix, char *postfix) {
    int i, j = 0;
    char ch;
    createStack();

    for (i = 0; infix[i] != '\0'; i++) {
        ch = infix[i];
        if (isalnum(ch)) {
            postfix[j++] = ch;
        } else if (ch == '(') {
            push(ch);
        } else if (ch == ')') {
            while (!isEmpty() && peek() != '(') {
                postfix[j++] = pop();
            }
            pop(); /* discard '(' */
        } else {
            while (!isEmpty() && precedence(peek()) >= precedence(ch)) {
                postfix[j++] = pop();
            }
            push(ch);
        }
    }
    while (!isEmpty()) {
        postfix[j++] = pop();
    }
    postfix[j] = '\0';
}

int main(void) {
    char infix[100], postfix[100];

    printf("Enter infix heat-index expression (e.g. (T*2-H*3)/(T-H)): ");
    scanf("%s", infix);

    infixToPostfix(infix, postfix);

    printf("Infix:   %s\n", infix);
    printf("Postfix: %s\n", postfix);

    return 0;
}
