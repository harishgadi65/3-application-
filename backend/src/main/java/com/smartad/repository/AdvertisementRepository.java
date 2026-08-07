package com.smartad.repository;

import com.smartad.entity.Advertisement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdvertisementRepository extends JpaRepository<Advertisement, Long> {

    List<Advertisement> findByIsActiveTrueOrderByDisplayOrderAsc();

    List<Advertisement> findAllByOrderByDisplayOrderAsc();
}
