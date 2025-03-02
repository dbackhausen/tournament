package de.eightbit.tc.tournament.util;

import org.modelmapper.ModelMapper;
import java.util.List;
import java.util.stream.Collectors;

public class MappingUtils {

    private static final ModelMapper modelMapper = new ModelMapper();

    public static <D, T> List<D> mapList(List<T> source, Class<D> targetClass) {
        return source.stream()
                .map(element -> modelMapper.map(element, targetClass))
                .collect(Collectors.toList());
    }
}