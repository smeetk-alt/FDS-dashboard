/*
 * Experiment 2: Singly Linked List
 * HeatSense use case: a chronological "alert log" of heatwave advisories.
 * Menu-driven: Insert at Begin, Insert after a specified existing node,
 * Delete before a specified existing node, Display all elements (tabular).
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Node {
    int alert_id;
    char region[30];
    struct Node *next;
};

struct Node *start = NULL;

void createSLL(void) {
    start = NULL;
}

int isEmpty(void) {
    return start == NULL;
}

void insertBegin(int alert_id, const char *region) {
    struct Node *newNode = (struct Node *)malloc(sizeof(struct Node));
    newNode->alert_id = alert_id;
    strcpy(newNode->region, region);
    newNode->next = start;
    start = newNode;
}

void insertAfter(int alert_id, const char *region, int existing_id) {
    struct Node *p = start;
    while (p != NULL && p->alert_id != existing_id) {
        p = p->next;
    }
    if (p == NULL) {
        printf("Existing alert %d not found.\n", existing_id);
        return;
    }
    struct Node *newNode = (struct Node *)malloc(sizeof(struct Node));
    newNode->alert_id = alert_id;
    strcpy(newNode->region, region);
    newNode->next = p->next;
    p->next = newNode;
}

struct Node *deleteBefore(int existing_id) {
    if (start == NULL || start->alert_id == existing_id) {
        printf("No node before %d.\n", existing_id);
        return NULL;
    }
    struct Node *prev = NULL, *cur = start;
    while (cur->next != NULL && cur->next->alert_id != existing_id) {
        prev = cur;
        cur = cur->next;
    }
    if (cur->next == NULL) {
        printf("Existing alert %d not found.\n", existing_id);
        return NULL;
    }
    /* cur is the node immediately before 'existing_id' -> delete cur */
    if (prev == NULL) {
        start = cur->next;
    } else {
        prev->next = cur->next;
    }
    return cur;
}

void display(void) {
    struct Node *p = start;
    printf("\n%-10s %-20s\n", "AlertID", "Region");
    while (p != NULL) {
        printf("%-10d %-20s\n", p->alert_id, p->region);
        p = p->next;
    }
}

int main(void) {
    int choice, id, existing;
    char region[30];
    struct Node *deleted;

    createSLL();

    while (1) {
        printf("\n1. Insert Begin  2. Insert After  3. Delete Before  4. Display  5. Exit\nChoice: ");
        if (scanf("%d", &choice) != 1) break;

        switch (choice) {
            case 1:
                printf("Alert ID: "); scanf("%d", &id);
                printf("Region: "); scanf("%s", region);
                insertBegin(id, region);
                break;
            case 2:
                printf("New Alert ID: "); scanf("%d", &id);
                printf("Region: "); scanf("%s", region);
                printf("Insert after existing Alert ID: "); scanf("%d", &existing);
                insertAfter(id, region, existing);
                break;
            case 3:
                printf("Delete the node before Alert ID: "); scanf("%d", &existing);
                deleted = deleteBefore(existing);
                if (deleted) {
                    printf("Deleted alert %d (%s)\n", deleted->alert_id, deleted->region);
                    free(deleted);
                }
                break;
            case 4:
                display();
                break;
            case 5:
                return 0;
            default:
                printf("Invalid choice.\n");
        }
    }
    return 0;
}
