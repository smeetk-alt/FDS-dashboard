/*
 * Experiment 5: Binary Search Tree
 * HeatSense use case: a BST of weather stations keyed by temperature, for
 * fast insert/search/delete and an inorder (sorted) listing.
 */
#include <stdio.h>
#include <stdlib.h>

struct Node {
    float temperature;
    struct Node *left, *right;
};

struct Node *root = NULL;

void createBST(void) {
    root = NULL;
}

struct Node *insertNode(struct Node *node, float temp) {
    if (node == NULL) {
        struct Node *newNode = (struct Node *)malloc(sizeof(struct Node));
        newNode->temperature = temp;
        newNode->left = newNode->right = NULL;
        return newNode;
    }
    if (temp < node->temperature) {
        node->left = insertNode(node->left, temp);
    } else if (temp > node->temperature) {
        node->right = insertNode(node->right, temp);
    }
    return node;
}

void insert(float temp) {
    root = insertNode(root, temp);
}

struct Node *search(struct Node *node, float temp) {
    if (node == NULL || node->temperature == temp) {
        return node;
    }
    if (temp < node->temperature) {
        return search(node->left, temp);
    }
    return search(node->right, temp);
}

struct Node *findMin(struct Node *node) {
    while (node->left != NULL) {
        node = node->left;
    }
    return node;
}

struct Node *deleteNode(struct Node *node, float temp) {
    if (node == NULL) return NULL;

    if (temp < node->temperature) {
        node->left = deleteNode(node->left, temp);
    } else if (temp > node->temperature) {
        node->right = deleteNode(node->right, temp);
    } else {
        if (node->left == NULL) {
            struct Node *r = node->right;
            free(node);
            return r;
        }
        if (node->right == NULL) {
            struct Node *l = node->left;
            free(node);
            return l;
        }
        struct Node *successor = findMin(node->right);
        node->temperature = successor->temperature;
        node->right = deleteNode(node->right, successor->temperature);
    }
    return node;
}

void displayInorder(struct Node *node) {
    if (node == NULL) return;
    displayInorder(node->left);
    printf("%.1f ", node->temperature);
    displayInorder(node->right);
}

int main(void) {
    int choice;
    float temp;

    createBST();

    while (1) {
        printf("\n1. Insert  2. Search  3. Delete  4. Display Inorder  5. Exit\nChoice: ");
        if (scanf("%d", &choice) != 1) break;

        switch (choice) {
            case 1:
                printf("Temperature: "); scanf("%f", &temp);
                insert(temp);
                break;
            case 2:
                printf("Search temperature: "); scanf("%f", &temp);
                if (search(root, temp)) {
                    printf("Found station reading %.1f\n", temp);
                } else {
                    printf("Not found.\n");
                }
                break;
            case 3:
                printf("Delete temperature: "); scanf("%f", &temp);
                root = deleteNode(root, temp);
                break;
            case 4:
                printf("Sorted readings: ");
                displayInorder(root);
                printf("\n");
                break;
            case 5:
                return 0;
            default:
                printf("Invalid choice.\n");
        }
    }
    return 0;
}
