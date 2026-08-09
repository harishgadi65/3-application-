package com.smartad.repository;

import com.smartad.entity.GameCatalogEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameCatalogRepository extends JpaRepository<GameCatalogEntry, String> {

    List<GameCatalogEntry> findAllByDeletedAtIsNullOrderByDisplayNameAsc();

    List<GameCatalogEntry> findAllByDeletedAtIsNotNullOrderByDisplayNameAsc();
}
