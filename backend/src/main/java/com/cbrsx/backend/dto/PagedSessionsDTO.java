package com.cbrsx.backend.dto;

import java.util.List;

public class PagedSessionsDTO {
    private List<SessionSummaryDTO> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public PagedSessionsDTO() {}

    public PagedSessionsDTO(List<SessionSummaryDTO> content, int page, int size, long totalElements, int totalPages) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    public List<SessionSummaryDTO> getContent() { return content; }
    public void setContent(List<SessionSummaryDTO> content) { this.content = content; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public static PagedSessionsDTOBuilder builder() { return new PagedSessionsDTOBuilder(); }

    public static class PagedSessionsDTOBuilder {
        private List<SessionSummaryDTO> content;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;

        public PagedSessionsDTOBuilder content(List<SessionSummaryDTO> content) { this.content = content; return this; }
        public PagedSessionsDTOBuilder page(int page) { this.page = page; return this; }
        public PagedSessionsDTOBuilder size(int size) { this.size = size; return this; }
        public PagedSessionsDTOBuilder totalElements(long totalElements) { this.totalElements = totalElements; return this; }
        public PagedSessionsDTOBuilder totalPages(int totalPages) { this.totalPages = totalPages; return this; }

        public PagedSessionsDTO build() {
            return new PagedSessionsDTO(content, page, size, totalElements, totalPages);
        }
    }
}
