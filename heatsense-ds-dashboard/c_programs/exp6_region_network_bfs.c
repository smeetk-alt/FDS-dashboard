/*
 * Experiment 6: Graph Traversal (BFS) using Adjacency Matrix
 * HeatSense use case: a "region network" graph (districts connected to
 * neighbouring districts); BFS shows the order a heatwave advisory would
 * spread outward from an epicentre region.
 */
#include <stdio.h>

#define MAXV 10

int adj[MAXV][MAXV];
int visited[MAXV];
int n;

/* static linear queue ADT, as required by the activity */
int queue[MAXV], qfront = 0, qrear = 0;

void initQueue(void) {
    qfront = qrear = 0;
}

int emptyQueue(void) {
    return qfront == qrear;
}

void addQueue(int v) {
    queue[qrear++] = v;
}

int deleteQueue(void) {
    return queue[qfront++];
}

void bfs(int start) {
    int v, w;
    initQueue();
    for (v = 0; v < n; v++) visited[v] = 0;

    visited[start] = 1;
    addQueue(start);

    printf("BFS advisory spread order: ");
    while (!emptyQueue()) {
        v = deleteQueue();
        printf("R%d ", v);
        for (w = 0; w < n; w++) {
            if (adj[v][w] == 1 && !visited[w]) {
                addQueue(w);
                visited[w] = 1;
            }
        }
    }
    printf("\n");
}

int main(void) {
    int i, j, edges, a, b, start;

    printf("Number of regions: ");
    scanf("%d", &n);

    for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
            adj[i][j] = 0;
        }
    }

    printf("Number of connections (edges): ");
    scanf("%d", &edges);

    printf("Enter each connection as: region_a region_b (0-indexed)\n");
    for (i = 0; i < edges; i++) {
        scanf("%d %d", &a, &b);
        adj[a][b] = 1;
        adj[b][a] = 1; /* undirected graph */
    }

    printf("Epicentre region: ");
    scanf("%d", &start);

    bfs(start);

    return 0;
}
